import Joi from 'joi';

export const createBudgetSchema = Joi.object({
  category_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  amount: Joi.number().positive().required(),
  period: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // format YYYY-MM
});

export const updateBudgetSchema = Joi.object({
  amount: Joi.number().positive().required(),
});
