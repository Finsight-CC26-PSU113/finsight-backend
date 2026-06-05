import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database.js';
import { successResponse } from '../utils/response.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple in-memory cache: userId → { summary, expiresAt }
const summaryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

const getMonthBounds = (year, month) => ({
  start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
});

const formatRp = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number(amount) || 0
  );

const pctChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return (((current - previous) / previous) * 100).toFixed(1);
};

export const getSpendingSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cached = summaryCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return successResponse(res, 200, 'AI spending summary retrieved', { summary: cached.summary, cached: true });
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    const { start: thisStart, end: thisEnd } = getMonthBounds(year, month);
    const { start: prevStart, end: prevEnd } = getMonthBounds(year, month - 1);

    const [
      thisIncomeAgg,
      thisExpenseAgg,
      prevIncomeAgg,
      prevExpenseAgg,
      categoryGroup,
      categories,
      budgets,
      savingsGoals,
      allIncomeAgg,
      allExpenseAgg,
      allSavedAgg,
      user,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'income', transaction_date: { gte: thisStart, lte: thisEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'expense', transaction_date: { gte: thisStart, lte: thisEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'income', transaction_date: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'expense', transaction_date: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.transaction.groupBy({
        by: ['category_id'],
        _sum: { amount: true },
        where: {
          user_id: userId,
          transaction_type: 'expense',
          category_id: { not: null },
          transaction_date: { gte: thisStart, lte: thisEnd },
        },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      prisma.category.findMany(),
      prisma.budget.findMany({
        where: { user_id: userId, period: `${year}-${String(month + 1).padStart(2, '0')}` },
        include: { category: true },
      }),
      prisma.savingsGoal.findMany({
        where: { user_id: userId },
        orderBy: { deadline: 'asc' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'income' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { user_id: userId, transaction_type: 'expense' },
      }),
      prisma.savingsGoal.aggregate({
        _sum: { saved_amount: true },
        where: { user_id: userId },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, financial_goal_name: true, financial_goal_target: true } }),
    ]);

    const thisIncome = Number(thisIncomeAgg._sum.amount || 0);
    const thisExpense = Number(thisExpenseAgg._sum.amount || 0);
    const prevIncome = Number(prevIncomeAgg._sum.amount || 0);
    const prevExpense = Number(prevExpenseAgg._sum.amount || 0);
    const netCashflow = thisIncome - thisExpense;
    const savingsRatio = thisIncome > 0 ? ((thisIncome - thisExpense) / thisIncome * 100).toFixed(1) : 0;
    const balance = Number(allIncomeAgg._sum.amount || 0) - Number(allExpenseAgg._sum.amount || 0);
    const totalSaved = Number(allSavedAgg._sum.saved_amount || 0);
    const totalSavingsTarget = savingsGoals.reduce((s, g) => s + Number(g.target_amount || 0), 0);

    const categoryMap = categories.reduce((m, c) => { m[c.id] = c.name; return m; }, {});
    const topCategories = categoryGroup.map((item) => ({
      name: categoryMap[item.category_id] || 'lainnya',
      amount: Number(item._sum.amount || 0),
    }));

    const budgetUtilization = await Promise.all(
      budgets.map(async (budget) => {
        const spentAgg = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            user_id: userId,
            category_id: budget.category_id,
            transaction_type: 'expense',
            transaction_date: { gte: thisStart, lte: thisEnd },
          },
        });
        const spent = Number(spentAgg._sum.amount || 0);
        const total = Number(budget.amount);
        const pct = total > 0 ? (spent / total) * 100 : 0;
        return { name: budget.category.name, pct: pct.toFixed(0), spent, total };
      })
    );

    const overBudget = budgetUtilization.filter((b) => b.pct >= 80).sort((a, b) => b.pct - a.pct);

    const incomeChangePct = pctChange(thisIncome, prevIncome);
    const expenseChangePct = pctChange(thisExpense, prevExpense);

    const nearestGoal = savingsGoals.find((g) => !g.is_completed && g.deadline);

    // Build prompt context
    const contextLines = [
      `Nama pengguna: ${user?.name || 'Pengguna'}`,
      `Bulan berjalan: ${monthName}`,
      '',
      `Pemasukan bulan ini: ${formatRp(thisIncome)}`,
      `Pengeluaran bulan ini: ${formatRp(thisExpense)}`,
      `Net cashflow: ${formatRp(netCashflow)} (${netCashflow >= 0 ? 'surplus' : 'defisit'})`,
      `Rasio tabungan: ${savingsRatio}%`,
      '',
      incomeChangePct !== null
        ? `Perbandingan vs bulan lalu — Pemasukan: ${incomeChangePct > 0 ? '+' : ''}${incomeChangePct}%, Pengeluaran: ${expenseChangePct > 0 ? '+' : ''}${expenseChangePct}%`
        : 'Belum ada data bulan lalu untuk perbandingan.',
      '',
      topCategories.length > 0
        ? `Top pengeluaran: ${topCategories.map((c) => `${c.name} (${formatRp(c.amount)})`).join(', ')}`
        : 'Belum ada pengeluaran dikategorikan bulan ini.',
      '',
      overBudget.length > 0
        ? `Budget yang sudah melewati/mendekati limit: ${overBudget.map((b) => `${b.name} ${b.pct}%`).join(', ')}`
        : 'Semua budget masih dalam batas aman.',
      '',
      savingsGoals.length > 0
        ? `Tujuan tabungan: ${savingsGoals.length} goal, total tersimpan ${formatRp(totalSaved)} dari target ${formatRp(totalSavingsTarget)}`
        : 'Belum ada tujuan tabungan.',
      nearestGoal
        ? `Goal terdekat: "${nearestGoal.name}" — deadline ${new Date(nearestGoal.deadline).toLocaleDateString('id-ID')}, tersimpan ${formatRp(nearestGoal.saved_amount)} dari ${formatRp(nearestGoal.target_amount)}`
        : '',
      '',
      `Saldo keseluruhan saat ini: ${formatRp(balance)}`,
      user?.financial_goal_name
        ? `Tujuan keuangan pengguna: ${user.financial_goal_name}${user.financial_goal_target ? ` (target ${formatRp(user.financial_goal_target)})` : ''}`
        : '',
    ].filter((line) => line !== undefined);

    const prompt = `Kamu adalah AI financial advisor dari aplikasi Finsight untuk anak muda Indonesia.
Berdasarkan data keuangan di bawah, tulis ringkasan keuangan yang personal, hangat, dan jujur dalam Bahasa Indonesia.
Panjang: 3-4 kalimat saja. Akui pola yang baik jika ada. Berikan tepat 1 saran konkret dan actionable di akhir.
Jangan gunakan bullet point atau daftar — tulis dalam bentuk paragraf mengalir.

Data keuangan:
${contextLines.join('\n')}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    summaryCache.set(userId, { summary, expiresAt: Date.now() + CACHE_TTL_MS });

    return successResponse(res, 200, 'AI spending summary retrieved', { summary, cached: false });
  } catch (err) {
    next(err);
  }
};
