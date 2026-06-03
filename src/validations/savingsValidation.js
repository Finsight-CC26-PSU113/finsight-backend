import Joi from 'joi';

export const createSavingsGoalSchema = Joi.object({
  name: Joi.string().max(100).required(),
  target_amount: Joi.number().positive().required(),
  deadline: Joi.date().iso().allow(null).optional(),
});

export const updateSavingsGoalSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  target_amount: Joi.number().positive().optional(),
  deadline: Joi.date().iso().allow(null).optional(),
}).min(1);

export const savingsTransferSchema = Joi.object({
  amount: Joi.number().positive().required(),
  payment_method: Joi.string()
    .valid('cash', 'debit_card', 'credit_card', 'e_wallet', 'bank_transfer')
    .optional(),
});
