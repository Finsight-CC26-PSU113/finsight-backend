import prisma from '../config/database.js';

/**
 * Checks budget threshold for a specific category and user, creating alerts if thresholds are reached.
 * @param {string} userId
 * @param {string} categoryId
 * @param {Date|string} transactionDate
 */
export const checkBudgetThresholds = async (userId, categoryId, transactionDate) => {
  try {
    const date = new Date(transactionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    // Find budget
    const budget = await prisma.budget.findUnique({
      where: {
        user_id_category_id_period: {
          user_id: userId,
          category_id: categoryId,
          period: period,
        },
      },
      include: {
        category: true,
      },
    });

    if (!budget) {
      return;
    }

    // Calculate sum of transactions in this budget period for the category
    const transactions = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        user_id: userId,
        category_id: categoryId,
        transaction_type: 'expense',
        transaction_date: {
          gte: budget.start_date,
          lte: budget.end_date,
        },
      },
    });

    const totalSpent = Number(transactions._sum.amount || 0);
    const budgetLimit = Number(budget.amount);

    if (budgetLimit <= 0) return;

    const percentage = (totalSpent / budgetLimit) * 100;
    const categoryName = budget.category.name;

    // Helper to create alert if not exists
    const triggerAlert = async (level) => {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          budget_id: budget.id,
          level: level,
        },
      });

      if (!existingAlert) {
        let levelText = '';
        if (level === 'warning') levelText = '70%';
        if (level === 'alert') levelText = '90%';
        if (level === 'over') levelText = '100%';

        await prisma.alert.create({
          data: {
            user_id: userId,
            category_id: categoryId,
            budget_id: budget.id,
            level: level,
            percentage: percentage,
            message: `Pengeluaran Anda untuk kategori ${categoryName} telah mencapai ${levelText} (${Math.round(percentage)}%) dari limit anggaran.`,
          },
        });
      }
    };

    // Evaluate thresholds
    if (percentage >= 100) {
      await triggerAlert('warning');
      await triggerAlert('alert');
      await triggerAlert('over');
    } else if (percentage >= 90) {
      await triggerAlert('warning');
      await triggerAlert('alert');
    } else if (percentage >= 70) {
      await triggerAlert('warning');
    }
  } catch (err) {
    console.error('Error in checkBudgetThresholds:', err);
  }
};
