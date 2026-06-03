import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_V4_REGEX.test(value);

const toNum = (value) => Number(value || 0);

/**
 * Serialize a SavingsGoal row into the shape the frontend expects:
 * { id, name, target_amount, saved_amount, remaining_amount, progress_percent, is_completed, deadline }
 */
const serializeGoal = (goal) => {
  const target = toNum(goal.target_amount);
  const saved = toNum(goal.saved_amount);
  const remaining = Math.max(0, target - saved);
  const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const isCompleted = target > 0 && saved >= target;

  return {
    id: goal.id,
    name: goal.name,
    target_amount: target,
    saved_amount: saved,
    remaining_amount: remaining,
    progress_percent: Number(progress.toFixed(2)),
    is_completed: isCompleted,
    deadline: goal.deadline,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
  };
};

/**
 * Main spendable balance derived from transactions, minus money already locked in goals.
 */
const computeAvailableBalance = async (userId) => {
  const [incomeAgg, expenseAgg, savedAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { user_id: userId, transaction_type: 'income' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { user_id: userId, transaction_type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.savingsGoal.aggregate({
      where: { user_id: userId },
      _sum: { saved_amount: true },
    }),
  ]);

  const income = toNum(incomeAgg._sum.amount);
  const expense = toNum(expenseAgg._sum.amount);
  const saved = toNum(savedAgg._sum.amount);

  return income - expense - saved;
};

export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    const availableBalance = await computeAvailableBalance(req.user.id);

    return successResponse(res, 200, 'Savings goals retrieved successfully', {
      goals: goals.map(serializeGoal),
      available_balance: availableBalance,
    });
  } catch (err) {
    next(err);
  }
};

export const getSavingsInsights = async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { user_id: req.user.id },
    });

    const availableBalance = await computeAvailableBalance(req.user.id);
    const serialized = goals.map(serializeGoal);
    const insights = [];

    if (serialized.length === 0) {
      insights.push({
        type: 'behavior',
        title: 'Mulai tujuan tabungan pertama Anda',
        description:
          'Anda belum memiliki tujuan tabungan. Tetapkan target seperti dana darurat untuk membangun kebiasaan menabung.',
      });
    }

    const completed = serialized.filter((g) => g.is_completed);
    if (completed.length > 0) {
      insights.push({
        type: 'achievement',
        title: `${completed.length} tujuan tercapai 🎉`,
        description: `Selamat! Anda telah memenuhi target untuk: ${completed
          .map((g) => g.name)
          .join(', ')}.`,
      });
    }

    serialized
      .filter((g) => !g.is_completed && g.deadline)
      .forEach((g) => {
        const monthsLeft =
          (new Date(g.deadline).getFullYear() - new Date().getFullYear()) * 12 +
          (new Date(g.deadline).getMonth() - new Date().getMonth());
        if (monthsLeft <= 0 && g.remaining_amount > 0) {
          insights.push({
            type: 'warning',
            title: `Tenggat "${g.name}" terlewat`,
            description: `Target belum tercapai (${g.progress_percent}%). Pertimbangkan menambah setoran atau menyesuaikan tenggat.`,
          });
        } else if (monthsLeft > 0 && g.remaining_amount > 0) {
          const recommendedMonthly = Math.ceil(g.remaining_amount / monthsLeft);
          insights.push({
            type: 'tip',
            title: `Sisihkan untuk "${g.name}"`,
            description: `Setor sekitar Rp${recommendedMonthly.toLocaleString(
              'id-ID'
            )} per bulan untuk mencapai target dalam ${monthsLeft} bulan.`,
          });
        }
      });

    if (availableBalance < 0) {
      insights.push({
        type: 'warning',
        title: 'Saldo utama negatif',
        description:
          'Pengeluaran dan alokasi tabungan Anda melebihi pemasukan. Tinjau kembali transaksi atau tarik sebagian dana tabungan.',
      });
    }

    return successResponse(res, 200, 'Savings insights retrieved successfully', { insights });
  } catch (err) {
    next(err);
  }
};

export const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, target_amount, deadline } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        user_id: req.user.id,
        name,
        target_amount,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return successResponse(res, 201, 'Savings goal created successfully', {
      goal: serializeGoal(goal),
    });
  } catch (err) {
    next(err);
  }
};

export const updateSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return errorResponse(res, 400, 'Invalid savings goal ID');
    }

    const existing = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const { name, target_amount, deadline } = req.body;
    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(target_amount !== undefined ? { target_amount } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
      },
    });

    return successResponse(res, 200, 'Savings goal updated successfully', {
      goal: serializeGoal(updated),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return errorResponse(res, 400, 'Invalid savings goal ID');
    }

    const existing = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    await prisma.savingsGoal.delete({ where: { id } });
    return successResponse(res, 200, 'Savings goal deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const depositToSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return errorResponse(res, 400, 'Invalid savings goal ID');
    }

    const { amount, payment_method } = req.body;

    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const availableBalance = await computeAvailableBalance(req.user.id);
    if (amount > availableBalance) {
      return errorResponse(
        res,
        400,
        `Insufficient balance. Available: ${availableBalance}, requested: ${amount}`
      );
    }

    const newSaved = toNum(goal.saved_amount) + Number(amount);
    const [updated] = await prisma.$transaction([
      prisma.savingsGoal.update({
        where: { id },
        data: {
          saved_amount: newSaved,
          is_completed: newSaved >= toNum(goal.target_amount),
        },
      }),
      prisma.savingsLedger.create({
        data: {
          user_id: req.user.id,
          goal_id: id,
          type: 'deposit',
          amount,
          payment_method: payment_method || 'bank_transfer',
        },
      }),
    ]);

    return successResponse(res, 200, 'Deposit successful', {
      goal: serializeGoal(updated),
      available_balance: availableBalance - Number(amount),
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawFromSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return errorResponse(res, 400, 'Invalid savings goal ID');
    }

    const { amount, payment_method } = req.body;

    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const currentSaved = toNum(goal.saved_amount);
    if (amount > currentSaved) {
      return errorResponse(
        res,
        400,
        `Cannot withdraw more than saved. Saved: ${currentSaved}, requested: ${amount}`
      );
    }

    const newSaved = currentSaved - Number(amount);
    const [updated] = await prisma.$transaction([
      prisma.savingsGoal.update({
        where: { id },
        data: {
          saved_amount: newSaved,
          is_completed: newSaved >= toNum(goal.target_amount),
        },
      }),
      prisma.savingsLedger.create({
        data: {
          user_id: req.user.id,
          goal_id: id,
          type: 'withdraw',
          amount,
          payment_method: payment_method || 'bank_transfer',
        },
      }),
    ]);

    const availableBalance = await computeAvailableBalance(req.user.id);
    return successResponse(res, 200, 'Withdrawal successful', {
      goal: serializeGoal(updated),
      available_balance: availableBalance,
    });
  } catch (err) {
    next(err);
  }
};
