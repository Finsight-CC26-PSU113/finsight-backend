import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { getSpendingSummary } from '../controllers/aiInsightController.js';

const router = Router();

router.get('/api/ai/spending-summary', authenticate, getSpendingSummary);

export default router;
