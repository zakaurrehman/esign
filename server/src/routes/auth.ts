import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

export default router;
