import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/auth.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/authValidation.js';

const router = Router();

router.post('/api/auth/register', validate(registerSchema), register);
router.post('/api/auth/login', validate(loginSchema), login);
router.post('/api/auth/logout', authenticate, logout);
router.get('/api/auth/profile', authenticate, getProfile);
router.patch('/api/auth/profile', authenticate, validate(updateProfileSchema), updateProfile);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
