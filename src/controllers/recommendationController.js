import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        user_id: req.user.id,
      },
      include: {
        category: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return successResponse(res, 200, 'Recommendations retrieved successfully', { recommendations });
  } catch (err) {
    next(err);
  }
};

export const updateRecommendationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.recommendation.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Recommendation not found');
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data: { status },
      include: {
        category: true,
      },
    });

    return successResponse(res, 200, 'Recommendation status updated successfully', { recommendation: updated });
  } catch (err) {
    next(err);
  }
};
