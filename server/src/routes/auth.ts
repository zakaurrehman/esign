import { Router } from 'express';
import { createUser, login, me, logout, listUsers, deleteUser } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', auth, me);
router.post('/logout', auth, logout);

// Admin-only routes
router.post('/users', auth, requireAdmin, validate(registerSchema), createUser);
router.get('/users', auth, requireAdmin, listUsers);
router.delete('/users/:userId', auth, requireAdmin, deleteUser);

export default router;
