import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(255).required(),
  phone: Joi.string().max(16).optional(),
  birthday: Joi.date().iso().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  phone: Joi.string().max(16).optional(),
  birthday: Joi.date().iso().optional(),
  push_notifications_enabled: Joi.boolean().optional(),
  email_notifications_enabled: Joi.boolean().optional(),
  investment_portfolio_value: Joi.number().min(0).optional(),
  financial_goal_name: Joi.string().max(100).allow('', null).optional(),
  financial_goal_target: Joi.number().min(0).allow(null).optional(),
  financial_goal_saved: Joi.number().min(0).allow(null).optional(),
}).min(1);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(255).required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(255).required(),
});
