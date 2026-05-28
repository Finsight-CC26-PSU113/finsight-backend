import { Router } from 'express';
import multer from 'multer';
import { scanReceipt } from '../controllers/receiptController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/api/scan', upload.single('image'), scanReceipt);
router.post('/scan', upload.single('image'), scanReceipt);

export default router;
