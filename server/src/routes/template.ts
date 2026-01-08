import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getActiveTemplate,
  getAllTemplates,
  upsertTemplate,
  setActiveTemplate,
  deleteTemplate
} from '../controllers/templateController';

const router = Router();

// Public route to get active template (authenticated users only)
router.get('/active', auth, getActiveTemplate);

// Admin routes
router.get('/', auth, getAllTemplates);
router.post('/', auth, upsertTemplate);
router.put('/:id/activate', auth, setActiveTemplate);
router.delete('/:id', auth, deleteTemplate);

export default router;
