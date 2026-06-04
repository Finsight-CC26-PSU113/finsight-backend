import Joi from 'joi';

export const saveRiskProfileSchema = Joi.object({
  score: Joi.number().integer().min(0).max(100).required(),
  risk_level: Joi.string().valid('low', 'medium', 'high').optional(),
  // answers: { "1": 3, "2": 2, ... } — question index mapped to chosen score
  answers: Joi.object()
    .pattern(Joi.string(), Joi.number().integer().min(1).max(5))
    .optional(),
});
