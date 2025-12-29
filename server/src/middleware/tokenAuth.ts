import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export interface SigningRequest extends Request {
  recipient?: {
    id: string;
    name: string;
    email: string;
    documentId: string;
  };
  document?: {
    id: string;
    title: string;
    status: string;
  };
}

export const tokenAuth = async (req: SigningRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId, token } = req.params;

    if (!documentId || !token) {
      return res.status(400).json({ error: 'Missing document ID or token' });
    }

    const recipient = await prisma.recipient.findFirst({
      where: {
        documentId,
        accessToken: token
      },
      include: {
        document: {
          select: { id: true, title: true, status: true }
        }
      }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Invalid signing link' });
    }

    if (recipient.tokenExpiresAt && new Date() > recipient.tokenExpiresAt) {
      return res.status(410).json({ error: 'Signing link has expired' });
    }

    if (recipient.status === 'SIGNED') {
      return res.status(400).json({ error: 'You have already signed this document' });
    }

    if (recipient.status === 'DECLINED') {
      return res.status(400).json({ error: 'You have declined to sign this document' });
    }

    if (recipient.document.status === 'VOIDED') {
      return res.status(400).json({ error: 'This document has been voided' });
    }

    if (recipient.document.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This document has already been completed' });
    }

    req.recipient = {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      documentId: recipient.documentId
    };
    req.document = recipient.document;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};
