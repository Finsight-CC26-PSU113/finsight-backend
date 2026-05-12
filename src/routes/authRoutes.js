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
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;