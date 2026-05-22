import logger from '../config/logger.js';
import { errorResponse } from '../utils/response.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack });

  if (err.name === 'PrismaClientKnownRequestError') {
    return errorResponse(res, 400, 'Database error');
  }

  return errorResponse(res, 500, 'Internal server error');
};

export default errorHandler;