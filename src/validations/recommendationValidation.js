import Joi from 'joi';

export const updateRecommendationSchema = Joi.object({
  status: Joi.string().valid('active', 'done', 'dismissed').required(),
});
