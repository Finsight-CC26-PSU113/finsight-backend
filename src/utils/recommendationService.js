import prisma from '../config/database.js';

const formatIdr = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

/**
 * Generate rule-based savings recommendations for a user based on their current
 * month spending vs budgets. Idempotent: a recommendation identified by
 * (user_id, category_id, type) is only created once, so user dismissals are
 * respected and the feed does not duplicate on every fetch.
 */
export const generateRecommendations = async (userId) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  const periodStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const [categories, budgets, spendingGroup, incomeAgg, expenseAgg] = await Promise.all([
    prisma.category.findMany(),
    prisma.budget.findMany({ where: { user_id: userId, period: periodStr } }),
    prisma.transaction.groupBy({
      by: ['category_id'],
      _sum: { amount: true },
      where: {
        user_id: userId,
        transaction_type: 'expense',
        category_id: { not: null },
        transaction_date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user_id: userId,
        transaction_type: 'income',
        transaction_date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user_id: userId,
        transaction_type: 'expense',
        transaction_date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const categoryName = categories.reduce((map, c) => {
    map[c.id] = c.name;
    return map;
  }, {});
  const budgetByCategory = budgets.reduce((map, b) => {
    map[b.category_id] = Number(b.amount);
    return map;
  }, {});
  const spendingByCategory = spendingGroup
    .map((g) => ({ category_id: g.category_id, amount: Number(g._sum.amount || 0) }))
    .sort((a, b) => b.amount - a.amount);

  const candidates = [];

  // Rule A — budget hampir/terlampaui (>= 90%)
  for (const { category_id, amount } of spendingByCategory) {
    const budget = budgetByCategory[category_id];
    if (!budget || budget <= 0) continue;
    const pct = (amount / budget) * 100;
    if (pct >= 90) {
      candidates.push({
        category_id,
        type: 'Anggaran hampir terlampaui',
        message: `Pengeluaran ${categoryName[category_id] || 'kategori ini'} sudah ${Math.round(
          pct
        )}% dari anggaran bulan ini (${formatIdr(amount)} dari ${formatIdr(
          budget
        )}). Pertimbangkan menahan pengeluaran di kategori ini.`,
        priority: pct >= 100 ? 'high' : 'medium',
      });
    }
  }

  // Rule B — kategori boros tanpa anggaran (pengeluaran terbesar, belum ada budget)
  const topUnbudgeted = spendingByCategory.find(
    (s) => s.amount > 0 && !budgetByCategory[s.category_id]
  );
  if (topUnbudgeted) {
    candidates.push({
      category_id: topUnbudgeted.category_id,
      type: 'Atur anggaran kategori boros',
      message: `Kategori ${
        categoryName[topUnbudgeted.category_id] || 'ini'
      } menjadi pengeluaran terbesar bulan ini (${formatIdr(
        topUnbudgeted.amount
      )}) tanpa anggaran. Tetapkan anggaran agar lebih terkontrol.`,
      priority: 'medium',
    });
  }

  // Rule C — pengeluaran melebihi pemasukan bulan ini
  const income = Number(incomeAgg._sum.amount || 0);
  const expense = Number(expenseAgg._sum.amount || 0);
  if (expense > income && spendingByCategory.length > 0) {
    candidates.push({
      category_id: spendingByCategory[0].category_id,
      type: 'Pengeluaran melebihi pemasukan',
      message: `Total pengeluaran bulan ini (${formatIdr(
        expense
      )}) melebihi pemasukan (${formatIdr(
        income
      )}). Tinjau pengeluaran terbesar Anda dan kurangi yang tidak penting.`,
      priority: 'high',
    });
  }

  if (candidates.length === 0) return;

  // Idempotency: skip candidates that already exist (any status) for the same
  // (user, category, type) so dismissed recommendations are not recreated.
  const existing = await prisma.recommendation.findMany({
    where: { user_id: userId },
    select: { category_id: true, type: true },
  });
  const existingKey = new Set(existing.map((e) => `${e.category_id}::${e.type}`));

  const toCreate = candidates.filter((c) => !existingKey.has(`${c.category_id}::${c.type}`));
  if (toCreate.length === 0) return;

  await prisma.recommendation.createMany({
    data: toCreate.map((c) => ({
      user_id: userId,
      category_id: c.category_id,
      type: c.type,
      message: c.message,
      priority: c.priority,
    })),
  });
};
