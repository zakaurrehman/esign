import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDocumentSchema, updateDocumentSchema, addRecipientSchema, addFieldSchema, updateFieldSchema } from '../schemas/document';
import {
  listDocuments,
  createDocument,
  uploadDocument,
  generatePdf,
  getDocument,
  updateDocument,
  deleteDocument,
  getPdf,
  addRecipient,
  updateRecipient,
  deleteRecipient,
  addField,
  updateField,
  deleteField,
  sendDocument,
  voidDocument,
  getAuditTrail
} from '../controllers/documentController';

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.pdf`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Document routes
router.get('/', auth, listDocuments);
router.post('/', auth, validate(createDocumentSchema), createDocument);
router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/:id', auth, getDocument);
router.put('/:id', auth, validate(updateDocumentSchema), updateDocument);
router.delete('/:id', auth, deleteDocument);
router.get('/:id/pdf', auth, getPdf);
router.post('/:id/generate-pdf', auth, generatePdf);
router.post('/:id/send', auth, sendDocument);
router.post('/:id/void', auth, voidDocument);
router.get('/:id/audit', auth, getAuditTrail);

// Recipient routes
router.post('/:id/recipients', auth, validate(addRecipientSchema), addRecipient);
router.put('/recipients/:recipientId', auth, updateRecipient);
router.delete('/recipients/:recipientId', auth, deleteRecipient);

// Field routes
router.post('/:id/fields', auth, validate(addFieldSchema), addField);
router.put('/fields/:fieldId', auth, updateField);
router.delete('/fields/:fieldId', auth, deleteField);

export default router;
