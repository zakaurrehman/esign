import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { CreateDocumentInput, UpdateDocumentInput, AddRecipientInput, AddFieldInput, UpdateFieldInput } from '../schemas/document';
import { generatePdfFromHtml, getPdfPageCount } from '../services/pdfService';
import { sendEmail, generateSigningEmail } from '../services/emailService';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const listDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: req.user!.id,
        deletedAt: null // Only show non-deleted documents
      },
      include: {
        recipients: { select: { id: true, name: true, email: true, status: true } },
        _count: { select: { fields: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
};

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, htmlContent } = req.body as CreateDocumentInput;

    const document = await prisma.document.create({
      data: {
        title,
        documentType: 'WRITTEN',
        htmlContent,
        userId: req.user!.id
      }
    });

    return res.status(201).json({ document });
  } catch (error) {
    console.error('Create document error:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const title = req.body.title || req.file.originalname.replace('.pdf', '');

    // Read the file and convert to base64
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = pdfBuffer.toString('base64');

    // Get page count
    const pageCount = await getPdfPageCount(req.file.path);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const document = await prisma.document.create({
      data: {
        title,
        documentType: 'UPLOADED',
        originalFilename: req.file.originalname,
        pdfData,
        pageCount,
        userId: req.user!.id
      }
    });

    return res.status(201).json({ document });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const generatePdf = async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.documentType !== 'WRITTEN') {
      return res.status(400).json({ error: 'PDF generation is only for written documents' });
    }

    if (!document.htmlContent) {
      return res.status(400).json({ error: 'Document has no content' });
    }

    const pdfFilename = `${crypto.randomUUID()}.pdf`;
    const pdfPath = path.join('/tmp', pdfFilename);

    await generatePdfFromHtml(document.htmlContent, pdfPath);
    const pageCount = await getPdfPageCount(pdfPath);

    // Read PDF and store as base64 in database
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = pdfBuffer.toString('base64');

    // Clean up temp file
    fs.unlinkSync(pdfPath);

    await prisma.document.update({
      where: { id: document.id },
      data: { pdfData, pageCount }
    });

    return res.json({ message: 'PDF generated successfully', pageCount });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    // First try to find document owned by user
    let document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        user: { select: { id: true, name: true, email: true, managerId: true } },
        recipients: {
          include: {
            fields: true
          }
        },
        fields: true,
        reviewedBy: { select: { id: true, name: true, email: true } }
      }
    });

    // If not found and user is a manager, check if document belongs to their team
    if (!document && req.user!.role === 'MANAGER') {
      const teamDocument = await prisma.document.findFirst({
        where: {
          id: req.params.id,
          user: { managerId: req.user!.id }
        },
        include: {
          user: { select: { id: true, name: true, email: true, managerId: true } },
          recipients: {
            include: {
              fields: true
            }
          },
          fields: true,
          reviewedBy: { select: { id: true, name: true, email: true } }
        }
      });
      document = teamDocument;
    }

    // If not found and user is admin, allow viewing any document
    if (!document && req.user!.role === 'SUPER_ADMIN') {
      const anyDocument = await prisma.document.findFirst({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, name: true, email: true, managerId: true } },
          recipients: {
            include: {
              fields: true
            }
          },
          fields: true,
          reviewedBy: { select: { id: true, name: true, email: true } }
        }
      });
      document = anyDocument;
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({ error: 'Failed to get document' });
  }
};

export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, htmlContent } = req.body as UpdateDocumentInput;

    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only edit draft documents' });
    }

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: { title, htmlContent }
    });

    return res.json({ document });
  } catch (error) {
    console.error('Update document error:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete draft documents' });
    }

    // Soft delete - mark as deleted with timestamp and user email
    await prisma.document.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user!.email
      }
    });

    return res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const getPdf = async (req: AuthRequest, res: Response) => {
  try {
    // First try to find document owned by user
    let document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    // If not found and user is a manager, check if document belongs to their team
    if (!document && req.user!.role === 'MANAGER') {
      document = await prisma.document.findFirst({
        where: {
          id: req.params.id,
          user: { managerId: req.user!.id }
        }
      });
    }

    // If not found and user is admin, allow viewing any document
    if (!document && req.user!.role === 'SUPER_ADMIN') {
      document = await prisma.document.findFirst({
        where: { id: req.params.id }
      });
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check for PDF data in database first (serverless compatible)
    if (document.pdfData) {
      const pdfBuffer = Buffer.from(document.pdfData, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.title}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    }

    // Fallback to file system (for local development)
    if (document.pdfPath && fs.existsSync(document.pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.title}.pdf"`);
      const fileStream = fs.createReadStream(document.pdfPath);
      return fileStream.pipe(res);
    }

    return res.status(404).json({ error: 'PDF not found' });
  } catch (error) {
    console.error('Get PDF error:', error);
    return res.status(500).json({ error: 'Failed to get PDF' });
  }
};

export const addRecipient = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, signingOrder } = req.body as AddRecipientInput;

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only add recipients to draft documents' });
    }

    const recipient = await prisma.recipient.create({
      data: {
        documentId: document.id,
        name,
        email,
        signingOrder: signingOrder || 1,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return res.status(201).json({ recipient });
  } catch (error) {
    console.error('Add recipient error:', error);
    return res.status(500).json({ error: 'Failed to add recipient' });
  }
};

export const updateRecipient = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, signingOrder } = req.body;

    const recipient = await prisma.recipient.findFirst({
      where: { id: req.params.recipientId },
      include: { document: true }
    });

    if (!recipient || recipient.document.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only update recipients in draft documents' });
    }

    const updated = await prisma.recipient.update({
      where: { id: req.params.recipientId },
      data: { name, email, signingOrder }
    });

    return res.json({ recipient: updated });
  } catch (error) {
    console.error('Update recipient error:', error);
    return res.status(500).json({ error: 'Failed to update recipient' });
  }
};

export const deleteRecipient = async (req: AuthRequest, res: Response) => {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { id: req.params.recipientId },
      include: { document: true }
    });

    if (!recipient || recipient.document.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete recipients from draft documents' });
    }

    await prisma.recipient.delete({ where: { id: req.params.recipientId } });

    return res.json({ message: 'Recipient deleted' });
  } catch (error) {
    console.error('Delete recipient error:', error);
    return res.status(500).json({ error: 'Failed to delete recipient' });
  }
};

export const addField = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as AddFieldInput;

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only add fields to draft documents' });
    }

    const recipient = await prisma.recipient.findFirst({
      where: { id: data.recipientId, documentId: document.id }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const field = await prisma.signatureField.create({
      data: {
        documentId: document.id,
        recipientId: data.recipientId,
        fieldType: data.fieldType,
        pageNumber: data.pageNumber,
        xPercent: data.xPercent,
        yPercent: data.yPercent,
        widthPercent: data.widthPercent,
        heightPercent: data.heightPercent,
        isRequired: data.isRequired ?? true
      }
    });

    return res.status(201).json({ field });
  } catch (error) {
    console.error('Add field error:', error);
    return res.status(500).json({ error: 'Failed to add field' });
  }
};

export const updateField = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as UpdateFieldInput;

    const field = await prisma.signatureField.findFirst({
      where: { id: req.params.fieldId },
      include: { document: true }
    });

    if (!field || field.document.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field.document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only update fields in draft documents' });
    }

    const updated = await prisma.signatureField.update({
      where: { id: req.params.fieldId },
      data
    });

    return res.json({ field: updated });
  } catch (error) {
    console.error('Update field error:', error);
    return res.status(500).json({ error: 'Failed to update field' });
  }
};

export const deleteField = async (req: AuthRequest, res: Response) => {
  try {
    const field = await prisma.signatureField.findFirst({
      where: { id: req.params.fieldId },
      include: { document: true }
    });

    if (!field || field.document.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field.document.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete fields from draft documents' });
    }

    await prisma.signatureField.delete({ where: { id: req.params.fieldId } });

    return res.json({ message: 'Field deleted' });
  } catch (error) {
    console.error('Delete field error:', error);
    return res.status(500).json({ error: 'Failed to delete field' });
  }
};

export const sendDocument = async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { recipients: true, fields: true, user: true }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'DRAFT' && document.status !== 'DENIED') {
      return res.status(400).json({ error: 'Document has already been sent or is pending approval' });
    }

    if (!document.pdfPath && !document.pdfData) {
      return res.status(400).json({ error: 'Document has no PDF. Please generate or upload a PDF first.' });
    }

    if (document.recipients.length === 0) {
      return res.status(400).json({ error: 'Document has no recipients' });
    }

    if (document.fields.length === 0) {
      return res.status(400).json({ error: 'Document has no signature fields' });
    }

    // Check if user has a manager assigned
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { manager: true }
    });

    if (user?.managerId && user?.role === 'USER') {
      // User has a manager - send for approval first
      await prisma.document.update({
        where: { id: document.id },
        data: { 
          status: 'PENDING_APPROVAL',
          approvalStatus: 'PENDING',
          managerFeedback: null // Clear any previous feedback
        }
      });

      // Notify manager via email
      if (user.manager) {
        const managerEmailHtml = `
          <h2>Document Pending Your Approval</h2>
          <p>Hello ${user.manager.name},</p>
          <p><strong>${req.user!.name}</strong> has submitted a document for your review:</p>
          <p><strong>Document:</strong> ${document.title}</p>
          <p><strong>Recipients:</strong> ${document.recipients.map(r => r.name).join(', ')}</p>
          <p>Please log in to review and approve or deny this document.</p>
          <a href="${process.env.FRONTEND_URL}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Document</a>
        `;

        await sendEmail({
          to: user.manager.email,
          subject: `Document Approval Required: ${document.title}`,
          html: managerEmailHtml
        }).catch(err => console.error('Failed to send email to manager', err));
      }

      await prisma.auditLog.create({
        data: {
          documentId: document.id,
          action: 'SENT_FOR_APPROVAL',
          actorEmail: req.user!.email,
          actorName: req.user!.name,
          details: `Document sent to manager ${user.manager?.name} for approval`
        }
      });

      return res.json({ message: 'Document sent to manager for approval', requiresApproval: true });
    }

    // No manager assigned or user is Manager/Admin - send directly
    await sendDocumentToRecipients(document, req.user!);

    return res.json({ message: 'Document sent for signing' });
  } catch (error) {
    console.error('Send document error:', error);
    return res.status(500).json({ error: 'Failed to send document' });
  }
};

// Helper function to send document to recipients
async function sendDocumentToRecipients(document: any, user: any) {
  // Update document status
  await prisma.document.update({
    where: { id: document.id },
    data: { 
      status: 'PENDING',
      approvalStatus: 'APPROVED'
    }
  });

  // Update first recipient(s) status to SENT (based on signing order)
  const minOrder = Math.min(...document.recipients.map((r: any) => r.signingOrder));
  await prisma.recipient.updateMany({
    where: { documentId: document.id, signingOrder: minOrder },
    data: { status: 'SENT' }
  });

  // Send email to first recipients
  const firstRecipients = document.recipients.filter((r: any) => r.signingOrder === minOrder);
  for (const recipient of firstRecipients) {
    const signingUrl = `${process.env.FRONTEND_URL}/sign/${document.id}/${recipient.accessToken}`;
    const emailHtml = generateSigningEmail(
      recipient.name,
      document.title,
      signingUrl,
      user.name
    );

    await sendEmail({
      to: recipient.email,
      subject: `Signature Request: ${document.title}`,
      html: emailHtml
    }).catch(err => console.error('Failed to send email to', recipient.email, err));
  }

  await prisma.auditLog.create({
    data: {
      documentId: document.id,
      action: 'DOCUMENT_SENT',
      actorEmail: user.email,
      actorName: user.name,
      details: `Document sent to ${document.recipients.length} recipient(s)`
    }
  });
}

// Get documents pending approval (for managers)
export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can access pending approvals' });
    }

    // Get all users managed by this manager
    const managedUsers = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      select: { id: true }
    });

    const userIds = managedUsers.map(u => u.id);

    // Get documents pending approval from managed users
    const documents = await prisma.document.findMany({
      where: {
        userId: { in: userIds },
        status: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING',
        deletedAt: null
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        recipients: { select: { id: true, name: true, email: true, status: true } },
        _count: { select: { fields: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ documents });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return res.status(500).json({ error: 'Failed to get pending approvals' });
  }
};

// Approve a document (manager only)
export const approveDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can approve documents' });
    }

    const document = await prisma.document.findFirst({
      where: { id: req.params.id },
      include: { 
        user: { include: { manager: true } },
        recipients: true 
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify this manager manages the document owner
    if (document.user.managerId !== req.user!.id) {
      return res.status(403).json({ error: 'You are not the manager for this user' });
    }

    if (document.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Document is not pending approval' });
    }

    // Update document with approval
    await prisma.document.update({
      where: { id: document.id },
      data: {
        approvalStatus: 'APPROVED',
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      }
    });

    // Now send to recipients
    await sendDocumentToRecipients(document, document.user);

    // Notify the document owner
    const ownerEmailHtml = `
      <h2>Document Approved</h2>
      <p>Hello ${document.user.name},</p>
      <p>Your document "<strong>${document.title}</strong>" has been approved by ${req.user!.name} and sent to recipients for signing.</p>
      <a href="${process.env.FRONTEND_URL}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Document</a>
    `;

    await sendEmail({
      to: document.user.email,
      subject: `Document Approved: ${document.title}`,
      html: ownerEmailHtml
    }).catch(err => console.error('Failed to send approval email', err));

    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'DOCUMENT_APPROVED',
        actorEmail: req.user!.email,
        actorName: req.user!.name,
        details: `Document approved by manager and sent to recipients`
      }
    });

    return res.json({ message: 'Document approved and sent to recipients' });
  } catch (error) {
    console.error('Approve document error:', error);
    return res.status(500).json({ error: 'Failed to approve document' });
  }
};

// Deny a document (manager only)
export const denyDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can deny documents' });
    }

    const { feedback } = req.body;

    if (!feedback || feedback.trim() === '') {
      return res.status(400).json({ error: 'Feedback is required when denying a document' });
    }

    const document = await prisma.document.findFirst({
      where: { id: req.params.id },
      include: { user: { include: { manager: true } } }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify this manager manages the document owner
    if (document.user.managerId !== req.user!.id) {
      return res.status(403).json({ error: 'You are not the manager for this user' });
    }

    if (document.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Document is not pending approval' });
    }

    // Update document with denial
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'DENIED',
        approvalStatus: 'DENIED',
        managerFeedback: feedback,
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      }
    });

    // Notify the document owner
    const ownerEmailHtml = `
      <h2>Document Requires Changes</h2>
      <p>Hello ${document.user.name},</p>
      <p>Your document "<strong>${document.title}</strong>" has been reviewed by ${req.user!.name} and requires changes.</p>
      <h3>Feedback from Manager:</h3>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        ${feedback}
      </div>
      <p>Please make the necessary changes and resubmit the document.</p>
      <a href="${process.env.FRONTEND_URL}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Edit Document</a>
    `;

    await sendEmail({
      to: document.user.email,
      subject: `Document Requires Changes: ${document.title}`,
      html: ownerEmailHtml
    }).catch(err => console.error('Failed to send denial email', err));

    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'DOCUMENT_DENIED',
        actorEmail: req.user!.email,
        actorName: req.user!.name,
        details: `Document denied by manager. Feedback: ${feedback}`
      }
    });

    return res.json({ message: 'Document denied and user notified' });
  } catch (error) {
    console.error('Deny document error:', error);
    return res.status(500).json({ error: 'Failed to deny document' });
  }
};

// Get team documents (for managers - all documents from their team)
export const getTeamDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can access team documents' });
    }

    // Get all users managed by this manager
    const managedUsers = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      select: { id: true }
    });

    const userIds = managedUsers.map(u => u.id);

    // Get all documents from managed users
    const documents = await prisma.document.findMany({
      where: {
        userId: { in: userIds },
        deletedAt: null
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        recipients: { select: { id: true, name: true, email: true, status: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { fields: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ documents });
  } catch (error) {
    console.error('Get team documents error:', error);
    return res.status(500).json({ error: 'Failed to get team documents' });
  }
};

export const voidDocument = async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status === 'COMPLETED' || document.status === 'VOIDED') {
      return res.status(400).json({ error: 'Cannot void a completed or already voided document' });
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'VOIDED' }
    });

    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'DOCUMENT_VOIDED',
        actorEmail: req.user!.email,
        actorName: req.user!.name
      }
    });

    return res.json({ message: 'Document voided' });
  } catch (error) {
    console.error('Void document error:', error);
    return res.status(500).json({ error: 'Failed to void document' });
  }
};

export const getAuditTrail = async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { documentId: document.id },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ auditLogs });
  } catch (error) {
    console.error('Get audit trail error:', error);
    return res.status(500).json({ error: 'Failed to get audit trail' });
  }
};

// Super Admin: View all documents (including deleted ones)
export const listAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is Super Admin
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    const { includeDeleted } = req.query;

    const documents = await prisma.document.findMany({
      where: includeDeleted === 'true' ? {} : { deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        recipients: {
          select: { id: true, name: true, email: true, status: true }
        },
        _count: { select: { fields: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ documents });
  } catch (error) {
    console.error('List all documents error:', error);
    return res.status(500).json({ error: 'Failed to list all documents' });
  }
};

export const convertDocToHtml = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mammoth = await import('mammoth');
    const filePath = req.file.path;

    const result = await mammoth.convertToHtml({ path: filePath });

    // Clean up temp file
    fs.unlink(filePath, () => {});

    // Wrap content in styled container
    const htmlContent = `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
        ${result.value}
      </div>
    `;

    return res.json({ htmlContent, messages: result.messages });
  } catch (error) {
    console.error('Convert doc error:', error);
    return res.status(500).json({ error: 'Failed to convert document' });
  }
};
