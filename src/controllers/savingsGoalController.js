import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { computeAvailableBalance, enrichSavingsGoal } from '../utils/balanceUtils.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_V4_REGEX.test(value);

const findUserGoal = async (userId, goalId) => {
  if (!isUuid(goalId)) return null;
  return prisma.savingsGoal.findFirst({
    where: { id: goalId, user_id: userId },
  });
};

const formatGoalResponse = (goal) => enrichSavingsGoal(goal);

const monthsBetween = (from, to) => {
  const start = new Date(from);
  const end = new Date(to);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    (end.getDate() >= start.getDate() ? 0 : -1)
  );
};

const buildGoalInsights = async (userId, goal) => {
  const enriched = formatGoalResponse(goal);
  const insights = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const deposits = await prisma.transaction.findMany({
    where: {
      user_id: userId,
      savings_goal_id: goal.id,
      transaction_type: 'savings_deposit',
      transaction_date: { gte: threeMonthsAgo },
    },
    select: { amount: true, transaction_date: true },
  });

  const totalDeposits = deposits.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const monthsObserved = Math.max(1, monthsBetween(threeMonthsAgo, now) || 1);
  const avgMonthlyDeposit = totalDeposits / monthsObserved;
  const remaining = enriched.remaining_amount;

  if (enriched.is_completed) {
    insights.push({
      goal_id: goal.id,
      type: 'positive',
      title: `${goal.name} tercapai`,
      description: 'Selamat! Target tabungan Anda sudah terpenuhi.',
      action: 'Lihat Tabungan',
    });
    return insights;
  }

  if (avgMonthlyDeposit > 0 && remaining > 0) {
    const monthsToTarget = Math.ceil(remaining / avgMonthlyDeposit);
    const estimatedDate = new Date(now);
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsToTarget);

    insights.push({
      goal_id: goal.id,
      type: 'behavior',
      title: `Estimasi tercapai: ${monthsToTarget} bulan`,
      description: `Berdasarkan rata-rata setoran ${formatIdr(avgMonthlyDeposit)}/bulan, target "${goal.name}" bisa tercapai sekitar ${estimatedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}.`,
      action: 'Tambah Tabungan',
      meta: { estimated_completion: estimatedDate.toISOString(), months_to_target: monthsToTarget },
    });
  } else if (remaining > 0) {
    insights.push({
      goal_id: goal.id,
      type: 'behavior',
      title: 'Mulai setoran rutin',
      description: `Belum ada pola setoran ke "${goal.name}". Mulai dengan nominal kecil secara rutin agar progres terukur.`,
      action: 'Tambah Tabungan',
    });
  }

  if (goal.deadline && remaining > 0) {
    const deadline = new Date(goal.deadline);
    const monthsLeft = Math.max(0, monthsBetween(now, deadline) + 1);
    const requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;

    insights.push({
      goal_id: goal.id,
      type: 'recommendation',
      title: 'Rekomendasi tabungan bulanan',
      description: `Agar target tercapai sebelum ${deadline.toLocaleDateString('id-ID')}, disarankan menabung sekitar ${formatIdr(requiredMonthly)} per bulan.`,
      action: 'Tambah Tabungan',
      meta: { recommended_monthly: Math.round(requiredMonthly) },
    });

    if (avgMonthlyDeposit > 0) {
      const monthsToTarget = Math.ceil(remaining / avgMonthlyDeposit);
      const estimatedDate = new Date(now);
      estimatedDate.setMonth(estimatedDate.getMonth() + monthsToTarget);

      if (estimatedDate > deadline) {
        insights.push({
          goal_id: goal.id,
          type: 'alert',
          title: 'Target berpotensi terlambat',
          description: `Pola setoran saat ini (${formatIdr(avgMonthlyDeposit)}/bulan) menunjukkan target "${goal.name}" baru tercapai setelah deadline. Pertimbangkan menaikkan nominal tabungan.`,
          action: 'Tinjau Tabungan',
        });
      }
    } else if (monthsLeft <= 2) {
      insights.push({
        goal_id: goal.id,
        type: 'alert',
        title: 'Deadline mendekati',
        description: `Target "${goal.name}" jatuh tempo ${deadline.toLocaleDateString('id-ID')} dan masih kurang ${formatIdr(remaining)}.`,
        action: 'Tambah Tabungan',
      });
    }
  }

  return insights;
};

const formatIdr = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));

export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    const availableBalance = await computeAvailableBalance(req.user.id);

    return successResponse(res, 200, 'Savings goals retrieved successfully', {
      goals: goals.map(formatGoalResponse),
      available_balance: availableBalance,
    });
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
        name: String(name).trim(),
        target_amount,
        saved_amount: 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return successResponse(res, 201, 'Savings goal created successfully', {
      goal: formatGoalResponse(goal),
    });
  } catch (err) {
    next(err);
  }
};

export const updateSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await findUserGoal(req.user.id, id);

    if (!existing) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const { name, target_amount, deadline } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (target_amount !== undefined) data.target_amount = target_amount;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data,
    });

    return successResponse(res, 200, 'Savings goal updated successfully', {
      goal: formatGoalResponse(goal),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await findUserGoal(req.user.id, id);

    if (!existing) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    if (Number(existing.saved_amount) > 0) {
      return errorResponse(
        res,
        400,
        'Tarik seluruh dana dari tujuan tabungan sebelum menghapus'
      );
    }

    await prisma.savingsGoal.delete({ where: { id } });

    return successResponse(res, 200, 'Savings goal deleted successfully', null);
  } catch (err) {
    next(err);
  }
};

export const depositToSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'bank_transfer', transaction_date } = req.body;

    const goal = await findUserGoal(req.user.id, id);
    if (!goal) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const transferAmount = Number(amount);
    const availableBalance = await computeAvailableBalance(req.user.id);

    if (transferAmount > availableBalance) {
      return errorResponse(
        res,
        400,
        `Saldo utama tidak mencukupi. Tersedia: ${formatIdr(availableBalance)}`
      );
    }

    const txDate = transaction_date ? new Date(transaction_date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: {
          saved_amount: { increment: transferAmount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          user_id: req.user.id,
          transaction_type: 'savings_deposit',
          amount: transferAmount,
          payment_method,
          transaction_date: txDate,
          savings_goal_id: id,
          description: `Setoran tabungan: ${goal.name}`,
        },
        include: { savings_goal: true },
      });

      return { goal: updatedGoal, transaction };
    });

    const available_balance = await computeAvailableBalance(req.user.id);

    return successResponse(res, 201, 'Deposit to savings goal successful', {
      goal: formatGoalResponse(result.goal),
      transaction: result.transaction,
      available_balance,
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawFromSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'bank_transfer', transaction_date } = req.body;

    const goal = await findUserGoal(req.user.id, id);
    if (!goal) {
      return errorResponse(res, 404, 'Savings goal not found');
    }

    const transferAmount = Number(amount);
    const savedAmount = Number(goal.saved_amount);

    if (transferAmount > savedAmount) {
      return errorResponse(
        res,
        400,
        `Dana di tujuan tabungan tidak mencukupi. Tersedia: ${formatIdr(savedAmount)}`
      );
    }

    const txDate = transaction_date ? new Date(transaction_date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: {
          saved_amount: { decrement: transferAmount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          user_id: req.user.id,
          transaction_type: 'savings_withdraw',
          amount: transferAmount,
          payment_method,
          transaction_date: txDate,
          savings_goal_id: id,
          description: `Penarikan tabungan: ${goal.name}`,
        },
        include: { savings_goal: true },
      });

      return { goal: updatedGoal, transaction };
    });

    const available_balance = await computeAvailableBalance(req.user.id);

    return successResponse(res, 201, 'Withdraw from savings goal successful', {
      goal: formatGoalResponse(result.goal),
      transaction: result.transaction,
      available_balance,
    });
  } catch (err) {
    next(err);
  }
};

export const getSavingsInsights = async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    const insightLists = await Promise.all(
      goals.map((goal) => buildGoalInsights(req.user.id, goal))
    );

    const insights = insightLists.flat();

    // Ringkasan arus kas: pemasukan vs pengeluaran 3 bulan terakhir
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [incomeAgg, expenseAgg, savingsAgg] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          user_id: req.user.id,
          transaction_type: 'income',
          transaction_date: { gte: threeMonthsAgo },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          user_id: req.user.id,
          transaction_type: 'expense',
          transaction_date: { gte: threeMonthsAgo },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          user_id: req.user.id,
          transaction_type: 'savings_deposit',
          transaction_date: { gte: threeMonthsAgo },
        },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount || 0);
    const expense = Number(expenseAgg._sum.amount || 0);
    const saved = Number(savingsAgg._sum.amount || 0);
    const surplus = income - expense;

    if (goals.length > 0 && surplus > 0 && saved < surplus * 0.1) {
      insights.push({
        goal_id: null,
        type: 'recommendation',
        title: 'Potensi alokasi tabungan',
        description: `Surplus 3 bulan terakhir sekitar ${formatIdr(surplus)}. Pertimbangkan mengalokasikan 10–20% ke tujuan tabungan aktif.`,
        action: 'Buka Tabungan',
      });
    }

    return successResponse(res, 200, 'Savings insights retrieved successfully', { insights });
  } catch (err) {
    next(err);
  }
};
