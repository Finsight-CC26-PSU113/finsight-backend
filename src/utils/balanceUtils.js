import prisma from '../config/database.js';

const sumByType = async (userId, transactionType) => {
  const agg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { user_id: userId, transaction_type: transactionType },
  });
  return Number(agg._sum.amount || 0);
};

/** Saldo utama = pemasukan + penarikan tabungan − pengeluaran − setoran tabungan */
export const computeAvailableBalance = async (userId) => {
  const [income, expense, savingsDeposit, savingsWithdraw] = await Promise.all([
    sumByType(userId, 'income'),
    sumByType(userId, 'expense'),
    sumByType(userId, 'savings_deposit'),
    sumByType(userId, 'savings_withdraw'),
  ]);

  return income + savingsWithdraw - expense - savingsDeposit;
};

export const enrichSavingsGoal = (goal) => {
  const target = Number(goal.target_amount);
  const saved = Number(goal.saved_amount);
  const progressPercent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const remaining = Math.max(0, target - saved);

  return {
    ...goal,
    target_amount: target,
    saved_amount: saved,
    progress_percent: Number(progressPercent.toFixed(2)),
    remaining_amount: remaining,
    is_completed: target > 0 && saved >= target,
  };
};
