import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getDefaultCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    return successResponse(res, 200, 'Default categories retrieved', { categories });
  } catch (err) {
    next(err);
  }
};

export const getUserCategories = async (req, res, next) => {
  try {
    const categories = await prisma.userCategory.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, 200, 'User categories retrieved', { categories });
  } catch (err) {
    next(err);
  }
};

export const createUserCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existing = await prisma.userCategory.findUnique({
      where: { user_id_name: { user_id: req.user.id, name } },
    });

    if (existing) {
      return errorResponse(res, 409, 'Category with that name already exists');
    }

    const category = await prisma.userCategory.create({
      data: { user_id: req.user.id, name },
    });

    return successResponse(res, 201, 'Category created', { category });
  } catch (err) {
    next(err);
  }
};

export const updateUserCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.userCategory.findUnique({ where: { id } });

    if (!category || category.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Category not found');
    }

    const updated = await prisma.userCategory.update({
      where: { id },
      data: { name },
    });

    return successResponse(res, 200, 'Category updated', { category: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteUserCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.userCategory.findUnique({ where: { id } });

    if (!category || category.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Category not found');
    }

    await prisma.userCategory.delete({ where: { id } });

    return successResponse(res, 200, 'Category deleted');
  } catch (err) {
    next(err);
  }
};