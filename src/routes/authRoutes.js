import { Router } from 'express';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  uploadAvatar,
} from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/auth.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/authValidation.js';

const router = Router();

const avatarStorage = multer.diskStorage({
  destination: path.resolve(process.cwd(), 'src', 'uploads', 'profile'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${req.user.id}-${Date.now()}-${randomUUID()}${ext}`);
  },
});

const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/api/auth/register', validate(registerSchema), register);
router.post('/api/auth/login', validate(loginSchema), login);
router.post('/api/auth/logout', authenticate, logout);
router.get('/api/auth/profile', authenticate, getProfile);
router.patch('/api/auth/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post(
  '/api/auth/profile/avatar',
  authenticate,
  uploadAvatarMiddleware.single('avatar'),
  uploadAvatar
);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/profile/avatar', authenticate, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

export default router;
