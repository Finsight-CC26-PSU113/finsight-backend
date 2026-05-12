import { errorResponse } from '../utils/response.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return errorResponse(res, 400, 'Validation failed', errors);
  }
  next();
};

export default validate;