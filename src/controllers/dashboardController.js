import prisma from '../config/database.js';
import { successResponse } from '../utils/response.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current month boundaries in UTC
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-indexed

    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    const periodStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    // 1. Total Income
    const incomeAgg = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        user_id: userId,
        transaction_type: 'income',
        transaction_date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // 2. Total Expense
    const expenseAgg = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        user_id: userId,
        transaction_type: 'expense',
        transaction_date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const total_income = Number(incomeAgg._sum.amount || 0);
    const total_expense = Number(expenseAgg._sum.amount || 0);
    // Compute overall user balance (aggregate of all-time incomes minus expenses)
    const incomeAllAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user_id: userId,
        transaction_type: 'income',
      },
    });

    const expenseAllAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user_id: userId,
        transaction_type: 'expense',
      },
    });

    const total_income_all = Number(incomeAllAgg._sum.amount || 0);
    const total_expense_all = Number(expenseAllAgg._sum.amount || 0);

    // Balance should represent the user's aggregate balance across all accounts (all-time)
    const balance = total_income_all - total_expense_all;

    // 3. Top Categories Expenses
    const categoryGroup = await prisma.transaction.groupBy({
      by: ['category_id'],
      _sum: {
        amount: true,
      },
      where: {
        user_id: userId,
        transaction_type: 'expense',
        category_id: {
          not: null,
        },
        transaction_date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Fetch categories to map names
    const categories = await prisma.category.findMany();
    const categoryMap = categories.reduce((map, cat) => {
      map[cat.id] = cat.name;
      return map;
    }, {});

    const top_categories = categoryGroup
      .map((item) => ({
        category_id: item.category_id,
        name: categoryMap[item.category_id] || 'lainnya',
        amount: Number(item._sum.amount || 0),
      }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Budget Progress per Category
    const budgets = await prisma.budget.findMany({
      where: {
        user_id: userId,
        period: periodStr,
      },
      include: {
        category: true,
      },
    });

    // For each budget, calculate spent amount in current month
    const budget_progress = await Promise.all(
      budgets.map(async (budget) => {
        const spentAgg = await prisma.transaction.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            user_id: userId,
            category_id: budget.category_id,
            transaction_type: 'expense',
            transaction_date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const spent_amount = Number(spentAgg._sum.amount || 0);
        const budget_amount = Number(budget.amount);
        const percentage = budget_amount > 0 ? (spent_amount / budget_amount) * 100 : 0;

        return {
          category_id: budget.category_id,
          name: budget.category.name,
          budget_amount,
          spent_amount,
          percentage: Number(percentage.toFixed(2)),
        };
      })
    );

    return successResponse(res, 200, 'Dashboard summary retrieved successfully', {
      total_income,
      total_expense,
      balance,
      top_categories,
      budget_progress,
    });
  } catch (err) {
    next(err);
  }
};
