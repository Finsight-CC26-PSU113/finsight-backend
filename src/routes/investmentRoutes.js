import { Router } from 'express';
import { getInvestments } from '../controllers/investmentController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.get('/api/investments', authenticate, getInvestments);

export default router;
