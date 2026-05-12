import { Router } from 'express';
import {
  getDefaultCategories,
  getUserCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
} from '../controllers/categoryController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';

const router = Router();

router.get('/categories', authenticate, getDefaultCategories);
router.get('/categories/custom', authenticate, getUserCategories);
router.post('/categories/custom', authenticate, validate(createCategorySchema), createUserCategory);
router.patch('/categories/custom/:id', authenticate, validate(updateCategorySchema), updateUserCategory);
router.delete('/categories/custom/:id', authenticate, deleteUserCategory);

export default router;