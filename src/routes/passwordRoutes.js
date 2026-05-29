import { Router } from 'express';
import { forgotPassword, resetPassword } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../validations/authValidation.js';

const router = Router();

router.post('/api/auth/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/api/auth/reset-password', validate(resetPasswordSchema), resetPassword);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
