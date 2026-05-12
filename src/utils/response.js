export const successResponse = (res, statusCode, message, data = null) => {
  const payload = { status: 'success', message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode, message, errors = null) => {
  const payload = { status: 'error', message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};