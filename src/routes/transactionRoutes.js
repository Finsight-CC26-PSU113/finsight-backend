import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  classifyTransaction,
  overrideCategory,
  submitAnomalyFeedback,
} from '../controllers/transactionController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  classifyTransactionSchema,
  overrideCategorySchema,
  anomalyFeedbackSchema,
} from '../validations/transactionValidation.js';

const router = Router();

// /api namespace
router.get('/api/transactions', authenticate, getTransactions);
router.post('/api/transactions', authenticate, validate(createTransactionSchema), createTransaction);
router.get('/api/transactions/:id', authenticate, getTransactionById);
router.put('/api/transactions/:id', authenticate, validate(updateTransactionSchema), updateTransaction);
router.delete('/api/transactions/:id', authenticate, deleteTransaction);

router.post('/api/transactions/classify', authenticate, validate(classifyTransactionSchema), classifyTransaction);
router.put('/api/transactions/:id/category', authenticate, validate(overrideCategorySchema), overrideCategory);
router.put('/api/transactions/:id/anomaly-feedback', authenticate, validate(anomalyFeedbackSchema), submitAnomalyFeedback);

// Root namespace fallback
router.get('/transactions', authenticate, getTransactions);
router.post('/transactions', authenticate, validate(createTransactionSchema), createTransaction);
router.get('/transactions/:id', authenticate, getTransactionById);
router.put('/transactions/:id', authenticate, validate(updateTransactionSchema), updateTransaction);
router.delete('/transactions/:id', authenticate, deleteTransaction);

router.post('/transactions/classify', authenticate, validate(classifyTransactionSchema), classifyTransaction);
router.put('/transactions/:id/category', authenticate, validate(overrideCategorySchema), overrideCategory);
router.put('/transactions/:id/anomaly-feedback', authenticate, validate(anomalyFeedbackSchema), submitAnomalyFeedback);

export default router;
