import { Router } from 'express';
import {
  getSavingsGoals,
  getSavingsInsights,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  depositToSavingsGoal,
  withdrawFromSavingsGoal,
} from '../controllers/savingsController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  savingsTransferSchema,
} from '../validations/savingsValidation.js';

const router = Router();

const register = (prefix) => {
  router.get(`${prefix}/savings-goals`, authenticate, getSavingsGoals);
  router.get(`${prefix}/savings-goals/insights`, authenticate, getSavingsInsights);
  router.post(
    `${prefix}/savings-goals`,
    authenticate,
    validate(createSavingsGoalSchema),
    createSavingsGoal
  );
  router.patch(
    `${prefix}/savings-goals/:id`,
    authenticate,
    validate(updateSavingsGoalSchema),
    updateSavingsGoal
  );
  router.delete(`${prefix}/savings-goals/:id`, authenticate, deleteSavingsGoal);
  router.post(
    `${prefix}/savings-goals/:id/deposit`,
    authenticate,
    validate(savingsTransferSchema),
    depositToSavingsGoal
  );
  router.post(
    `${prefix}/savings-goals/:id/withdraw`,
    authenticate,
    validate(savingsTransferSchema),
    withdrawFromSavingsGoal
  );
};

// /api namespace + root fallback (mirrors other routers)
register('/api');
register('');

export default router;
