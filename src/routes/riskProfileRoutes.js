import { Router } from 'express';
import { saveRiskProfile, getRiskProfile } from '../controllers/riskProfileController.js';
import authenticate from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { saveRiskProfileSchema } from '../validations/riskProfileValidation.js';

const router = Router();

const register = (prefix) => {
  router.get(`${prefix}/risk-profile`, authenticate, getRiskProfile);
  router.post(
    `${prefix}/risk-profile`,
    authenticate,
    validate(saveRiskProfileSchema),
    saveRiskProfile
  );
};

register('/api');
register('');

export default router;
