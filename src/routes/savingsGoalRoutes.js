import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  savingsTransferSchema,
} from '../validations/savingsGoalValidation.js';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  depositToSavingsGoal,
  withdrawFromSavingsGoal,
  getSavingsInsights,
} from '../controllers/savingsGoalController.js';

const router = Router();

router.get('/api/savings-goals/insights', authenticate, getSavingsInsights);
router.get('/api/savings-goals', authenticate, getSavingsGoals);
router.post('/api/savings-goals', authenticate, validate(createSavingsGoalSchema), createSavingsGoal);
router.patch('/api/savings-goals/:id', authenticate, validate(updateSavingsGoalSchema), updateSavingsGoal);
router.delete('/api/savings-goals/:id', authenticate, deleteSavingsGoal);
router.post(
  '/api/savings-goals/:id/deposit',
  authenticate,
  validate(savingsTransferSchema),
  depositToSavingsGoal
);
router.post(
  '/api/savings-goals/:id/withdraw',
  authenticate,
  validate(savingsTransferSchema),
  withdrawFromSavingsGoal
);

export default router;
