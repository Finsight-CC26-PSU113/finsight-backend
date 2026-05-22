import { Router } from 'express';
import {
  getRecommendations,
  updateRecommendationStatus,
} from '../controllers/recommendationController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { updateRecommendationSchema } from '../validations/recommendationValidation.js';

const router = Router();

// /api namespace
router.get('/api/recommendations', authenticate, getRecommendations);
router.put('/api/recommendations/:id/status', authenticate, validate(updateRecommendationSchema), updateRecommendationStatus);

// Root namespace fallback
router.get('/recommendations', authenticate, getRecommendations);
router.put('/recommendations/:id/status', authenticate, validate(updateRecommendationSchema), updateRecommendationStatus);

export default router;
