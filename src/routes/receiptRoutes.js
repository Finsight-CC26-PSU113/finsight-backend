import { Router } from 'express';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { scanReceipt } from '../controllers/receiptController.js';
import authenticate from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'src', 'uploads', 'ocr'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const userId = req.user?.id || 'anon';
      cb(null, `${userId}-${Date.now()}-${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/api/scan', authenticate, upload.single('image'), scanReceipt);
router.post('/scan', authenticate, upload.single('image'), scanReceipt);

export default router;
