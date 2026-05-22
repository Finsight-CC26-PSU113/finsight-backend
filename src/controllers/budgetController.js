import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getBudgets = async (req, res, next) => {
  try {
    const { period } = req.query;
    const filter = { user_id: req.user.id };

    if (period) {
      filter.period = period;
    }

    const budgets = await prisma.budget.findMany({
      where: filter,
      include: {
        category: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return successResponse(res, 200, 'Budgets retrieved successfully', { budgets });
  } catch (err) {
    next(err);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { category_id, amount, period } = req.body;

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: category_id },
    });

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Parse period YYYY-MM
    const [yearStr, monthStr] = period.split('-');
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);

    const start_date = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end_date = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Upsert budget to handle cases where it already exists
    const budget = await prisma.budget.upsert({
      where: {
        user_id_category_id_period: {
          user_id: req.user.id,
          category_id,
          period,
        },
      },
      update: {
        amount,
        start_date,
        end_date,
      },
      create: {
        user_id: req.user.id,
        category_id,
        amount,
        period,
        start_date,
        end_date,
      },
      include: {
        category: true,
      },
    });

    return successResponse(res, 201, 'Budget set successfully', { budget });
  } catch (err) {
    next(err);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: { amount },
      include: {
        category: true,
      },
    });

    return successResponse(res, 200, 'Budget updated successfully', { budget });
  } catch (err) {
    next(err);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Budget not found');
    }

    await prisma.budget.delete({
      where: { id },
    });

    return successResponse(res, 200, 'Budget deleted successfully');
  } catch (err) {
    next(err);
  }
};
