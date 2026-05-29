import { Router } from 'express';
import path from 'node:path';
import multer from 'multer';
import { scanReceipt } from '../controllers/receiptController.js';
import authenticate from '../middleware/auth.js';
import { createMimeTypeFilter, createShortUploadFilename } from '../utils/upload.js';

const router = Router();
const receiptImageMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/heic',
  'image/heif',
  'image/webp',
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'src', 'uploads', 'ocr'),
    filename: (req, file, cb) => {
      const userPrefix = (req.user?.id || 'anon').slice(0, 8);
      cb(null, createShortUploadFilename(`ocr-${userPrefix}`, file.originalname));
    },
  }),
  fileFilter: createMimeTypeFilter(
    receiptImageMimeTypes,
    'Only PNG, JPG, JPEG, HEIC, HEIF, and WEBP images are allowed'
  ),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/api/scan', authenticate, upload.single('image'), scanReceipt);
router.post('/scan', authenticate, upload.single('image'), scanReceipt);

export default router;
