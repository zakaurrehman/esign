import { Router } from 'express';
import { tokenAuth } from '../middleware/tokenAuth';
import {
  getSigningPage,
  getSigningPdf,
  submitSignature,
  completeSigning,
  declineSigning
} from '../controllers/signController';

const router = Router();

// All routes require token authentication
router.get('/:documentId/:token', tokenAuth, getSigningPage);
router.get('/:documentId/:token/pdf', tokenAuth, getSigningPdf);
router.post('/:documentId/:token/signature', tokenAuth, submitSignature);
router.post('/:documentId/:token/complete', tokenAuth, completeSigning);
router.post('/:documentId/:token/decline', tokenAuth, declineSigning);

export default router;
