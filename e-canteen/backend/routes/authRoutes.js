import express from 'express';
import { register, login, getMe, createAdmin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../validations/schemas.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/create-admin', validate(registerSchema), createAdmin);

// Protected routes
router.get('/me', protect, getMe);

export default router;
