import { Response } from 'express';
import { SigningRequest } from '../middleware/tokenAuth';
import prisma from '../lib/prisma';
import fs from 'fs';
import { sendEmail, generateSigningEmail } from '../services/emailService';

export const getSigningPage = async (req: SigningRequest, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.recipient!.documentId },
      include: {
        fields: {
          where: { recipientId: req.recipient!.id }
        },
        recipients: {
          select: { id: true, name: true, status: true, signingOrder: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update recipient to VIEWED if first time
    if (req.recipient!.id) {
      const recipient = await prisma.recipient.findUnique({
        where: { id: req.recipient!.id }
      });

      if (recipient && recipient.status === 'SENT') {
        await prisma.recipient.update({
          where: { id: req.recipient!.id },
          data: {
            status: 'VIEWED',
            viewedAt: new Date()
          }
        });

        await prisma.auditLog.create({
          data: {
            documentId: document.id,
            action: 'DOCUMENT_VIEWED',
            actorEmail: req.recipient!.email,
            actorName: req.recipient!.name,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        });
      }
    }

    return res.json({
      document: {
        id: document.id,
        title: document.title,
        pageCount: document.pageCount
      },
      recipient: {
        id: req.recipient!.id,
        name: req.recipient!.name,
        email: req.recipient!.email
      },
      fields: document.fields,
      allRecipients: document.recipients
    });
  } catch (error) {
    console.error('Get signing page error:', error);
    return res.status(500).json({ error: 'Failed to get signing page' });
  }
};

export const getSigningPdf = async (req: SigningRequest, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.recipient!.documentId }
    });

    if (!document || !document.pdfPath) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    if (!fs.existsSync(document.pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.title}.pdf"`);

    const fileStream = fs.createReadStream(document.pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get signing PDF error:', error);
    return res.status(500).json({ error: 'Failed to get PDF' });
  }
};

export const submitSignature = async (req: SigningRequest, res: Response) => {
  try {
    const { fieldId, value } = req.body;

    if (!fieldId || !value) {
      return res.status(400).json({ error: 'Field ID and value are required' });
    }

    const field = await prisma.signatureField.findFirst({
      where: {
        id: fieldId,
        recipientId: req.recipient!.id,
        documentId: req.recipient!.documentId
      }
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field.completedAt) {
      return res.status(400).json({ error: 'Field has already been completed' });
    }

    await prisma.signatureField.update({
      where: { id: fieldId },
      data: {
        value,
        completedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        documentId: req.recipient!.documentId,
        action: `FIELD_COMPLETED`,
        actorEmail: req.recipient!.email,
        actorName: req.recipient!.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: `Field type: ${field.fieldType}, Page: ${field.pageNumber}`
      }
    });

    return res.json({ message: 'Signature submitted' });
  } catch (error) {
    console.error('Submit signature error:', error);
    return res.status(500).json({ error: 'Failed to submit signature' });
  }
};

export const completeSigning = async (req: SigningRequest, res: Response) => {
  try {
    // Check all required fields are completed
    const incompleteFields = await prisma.signatureField.findMany({
      where: {
        recipientId: req.recipient!.id,
        documentId: req.recipient!.documentId,
        isRequired: true,
        completedAt: null
      }
    });

    if (incompleteFields.length > 0) {
      return res.status(400).json({
        error: 'Please complete all required fields',
        incompleteCount: incompleteFields.length
      });
    }

    // Update recipient status
    await prisma.recipient.update({
      where: { id: req.recipient!.id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await prisma.auditLog.create({
      data: {
        documentId: req.recipient!.documentId,
        action: 'RECIPIENT_SIGNED',
        actorEmail: req.recipient!.email,
        actorName: req.recipient!.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Check if all recipients have signed
    const pendingRecipients = await prisma.recipient.findMany({
      where: {
        documentId: req.recipient!.documentId,
        status: { notIn: ['SIGNED', 'DECLINED'] }
      }
    });

    if (pendingRecipients.length === 0) {
      // All recipients have signed - mark document as completed
      await prisma.document.update({
        where: { id: req.recipient!.documentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          documentId: req.recipient!.documentId,
          action: 'DOCUMENT_COMPLETED',
          details: 'All recipients have signed'
        }
      });

      // TODO: Trigger PDF merge and distribution job
    } else {
      // Update document to IN_PROGRESS
      await prisma.document.update({
        where: { id: req.recipient!.documentId },
        data: { status: 'IN_PROGRESS' }
      });

      // Check for next recipients in signing order
      const currentRecipient = await prisma.recipient.findUnique({
        where: { id: req.recipient!.id }
      });

      if (currentRecipient) {
        // Get next signers (recipients with next signing order who are still pending)
        const nextRecipients = await prisma.recipient.findMany({
          where: {
            documentId: req.recipient!.documentId,
            status: 'PENDING',
            signingOrder: {
              gt: currentRecipient.signingOrder
            }
          },
          orderBy: { signingOrder: 'asc' }
        });

        if (nextRecipients.length > 0) {
          const nextOrder = nextRecipients[0].signingOrder;
          const recipientsToNotify = nextRecipients.filter(r => r.signingOrder === nextOrder);

          await prisma.recipient.updateMany({
            where: {
              documentId: req.recipient!.documentId,
              signingOrder: nextOrder,
              status: 'PENDING'
            },
            data: { status: 'SENT' }
          });

          // Send email to next recipients
          const document = await prisma.document.findUnique({
            where: { id: req.recipient!.documentId },
            include: { user: true }
          });

          if (document) {
            for (const recipient of recipientsToNotify) {
              const signingUrl = `${process.env.FRONTEND_URL}/sign/${document.id}/${recipient.accessToken}`;
              const emailHtml = generateSigningEmail(
                recipient.name,
                document.title,
                signingUrl,
                document.user.name
              );

              await sendEmail({
                to: recipient.email,
                subject: `Signature Request: ${document.title}`,
                html: emailHtml
              }).catch(err => console.error('Failed to send email to', recipient.email, err));
            }
          }
        }
      }
    }

    return res.json({ message: 'Signing completed' });
  } catch (error) {
    console.error('Complete signing error:', error);
    return res.status(500).json({ error: 'Failed to complete signing' });
  }
};

export const declineSigning = async (req: SigningRequest, res: Response) => {
  try {
    const { reason } = req.body;

    await prisma.recipient.update({
      where: { id: req.recipient!.id },
      data: {
        status: 'DECLINED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await prisma.auditLog.create({
      data: {
        documentId: req.recipient!.documentId,
        action: 'RECIPIENT_DECLINED',
        actorEmail: req.recipient!.email,
        actorName: req.recipient!.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: reason || 'No reason provided'
      }
    });

    // TODO: Notify document owner

    return res.json({ message: 'Signing declined' });
  } catch (error) {
    console.error('Decline signing error:', error);
    return res.status(500).json({ error: 'Failed to decline signing' });
  }
};
