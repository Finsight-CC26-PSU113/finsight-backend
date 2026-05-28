import logger from '../config/logger.js';
import { errorResponse } from '../utils/response.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack });

  if (err.name === 'PrismaClientKnownRequestError') {
    return errorResponse(res, 400, 'Database error');
  }

  // Multer file upload limits
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 413, 'Uploaded file is too large. Max size is 10MB');
  }

  return errorResponse(res, 500, 'Internal server error');
};

export default errorHandler;
