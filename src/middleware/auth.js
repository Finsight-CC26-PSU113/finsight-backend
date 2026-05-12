import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import prisma from '../config/database.js';

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return errorResponse(res, 401, 'Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return errorResponse(res, 401, 'Unauthorized');
    }

    req.user = user;
    next();
  } catch {
    return errorResponse(res, 401, 'Unauthorized');
  }
};

export default authenticate;