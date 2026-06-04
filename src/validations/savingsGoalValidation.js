import Joi from 'joi';

const deadlineField = Joi.alternatives()
  .try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
  .allow(null, '')
  .optional();

export const createSavingsGoalSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  target_amount: Joi.number().positive().required(),
  deadline: deadlineField,
});

export const updateSavingsGoalSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  target_amount: Joi.number().positive().optional(),
  deadline: deadlineField,
}).min(1);

export const savingsTransferSchema = Joi.object({
  amount: Joi.number().positive().required(),
  payment_method: Joi.string()
    .valid('cash', 'debit_card', 'credit_card', 'e_wallet', 'bank_transfer')
    .default('bank_transfer')
    .optional(),
  transaction_date: Joi.date().iso().optional(),
});
