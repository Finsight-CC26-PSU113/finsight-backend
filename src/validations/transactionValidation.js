import Joi from 'joi';

export const createTransactionSchema = Joi.object({
  transaction_type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().required(),
  transaction_date: Joi.date().iso().required(),
  payment_method: Joi.string()
    .valid('cash', 'debit_card', 'credit_card', 'e_wallet', 'bank_transfer')
    .required(),
  category_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  user_category_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  description: Joi.string().max(1000).allow(null, '').optional(),
});

export const updateTransactionSchema = Joi.object({
  transaction_type: Joi.string().valid('income', 'expense').optional(),
  amount: Joi.number().positive().optional(),
  transaction_date: Joi.date().iso().optional(),
  payment_method: Joi.string()
    .valid('cash', 'debit_card', 'credit_card', 'e_wallet', 'bank_transfer')
    .optional(),
  category_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  user_category_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  description: Joi.string().max(1000).allow(null, '').optional(),
}).min(1);

export const classifyTransactionSchema = Joi.object({
  description: Joi.string().required(),
  amount: Joi.number().required(),
});

export const overrideCategorySchema = Joi.object({
  corrected_category_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  feedback_type: Joi.string().max(50).default('user_override').optional(),
});

export const anomalyFeedbackSchema = Joi.object({
  is_anomaly: Joi.boolean().required(),
});
