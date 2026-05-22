import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

// /api namespace
router.get('/api/dashboard/summary', authenticate, getDashboardSummary);

// Root namespace fallback
router.get('/dashboard/summary', authenticate, getDashboardSummary);

export default router;
