import { Router } from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
} from '../validations/budgetValidation.js';

const router = Router();

// /api namespace
router.get('/api/budgets', authenticate, getBudgets);
router.post('/api/budgets', authenticate, validate(createBudgetSchema), createBudget);
router.put('/api/budgets/:id', authenticate, validate(updateBudgetSchema), updateBudget);
router.delete('/api/budgets/:id', authenticate, deleteBudget);

// Root namespace fallback
router.get('/budgets', authenticate, getBudgets);
router.post('/budgets', authenticate, validate(createBudgetSchema), createBudget);
router.put('/budgets/:id', authenticate, validate(updateBudgetSchema), updateBudget);
router.delete('/budgets/:id', authenticate, deleteBudget);

export default router;
