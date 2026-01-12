import { Router } from 'express';
import { createUser, login, me, logout, listUsers, deleteUser, getManagers, updateUser } from '../controllers/authController';
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
router.post('/users', auth, requireAdmin, createUser);
router.get('/users', auth, requireAdmin, listUsers);
router.get('/managers', auth, getManagers); // Get managers for dropdown
router.put('/users/:userId', auth, requireAdmin, updateUser);
router.delete('/users/:userId', auth, requireAdmin, deleteUser);

export default router;
