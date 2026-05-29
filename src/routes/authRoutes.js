import { Router } from 'express';
import path from 'node:path';
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
import { createMimeTypeFilter, createShortUploadFilename } from '../utils/upload.js';

const router = Router();
const profileImageMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/webp',
]);

const avatarStorage = multer.diskStorage({
  destination: path.resolve(process.cwd(), 'src', 'uploads', 'profile'),
  filename: (req, file, cb) => {
    cb(null, createShortUploadFilename(`av-${req.user.id.slice(0, 8)}`, file.originalname));
  },
});

const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  fileFilter: createMimeTypeFilter(
    profileImageMimeTypes,
    'Only PNG, JPG, JPEG, SVG, HEIC, HEIF, and WEBP images are allowed'
  ),
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
