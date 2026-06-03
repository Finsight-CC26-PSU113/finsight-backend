import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Categories
  const categories = [
    'makanan',
    'transport',
    'hiburan',
    'belanja',
    'kesehatan',
    'tagihan',
    'lainnya'
  ];

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    console.log(`Upserted category: ${categoryName}`);
  }

  // 2. Seed Investment Products (minimal catalog)
  const investmentProducts = [
    {
      category: 'stock',
      symbol: 'BBCA',
      name: 'Bank Central Asia Tbk',
      provider: 'IDX',
      currency: 'IDR',
      risk_level: 'high',
      return_1y: 0.12,
      return_3y: 0.35,
      meta: { lot_size: 100, sector: 'Banking' },
    },
    {
      category: 'stock',
      symbol: 'TLKM',
      name: 'Telkom Indonesia (Persero) Tbk',
      provider: 'IDX',
      currency: 'IDR',
      risk_level: 'medium',
      return_1y: 0.08,
      return_3y: 0.22,
      meta: { lot_size: 100, sector: 'Telecom' },
    },
    {
      category: 'mutual_fund',
      symbol: 'RDPU001',
      name: 'Reksa Dana Pasar Uang (Contoh)',
      provider: 'DummyManager',
      currency: 'IDR',
      risk_level: 'low',
      return_1y: 0.05,
      return_3y: 0.15,
      meta: { nav_unit: 'IDR/unit' },
    },
    {
      category: 'mutual_fund',
      symbol: 'RDSH001',
      name: 'Reksa Dana Saham (Contoh)',
      provider: 'DummyManager',
      currency: 'IDR',
      risk_level: 'high',
      return_1y: 0.14,
      return_3y: 0.4,
      meta: { nav_unit: 'IDR/unit' },
    },
    {
      category: 'bond',
      symbol: 'SBN-SBR013',
      name: 'SBR013 (Savings Bond Ritel)',
      provider: 'Kemenkeu',
      currency: 'IDR',
      risk_level: 'low',
      tenor_months: 24,
      coupon_rate: 0.064,
      meta: { coupon_type: 'floating_with_floor' },
    },
    {
      category: 'bond',
      symbol: 'ORI024',
      name: 'ORI024 (Obligasi Negara Ritel)',
      provider: 'Kemenkeu',
      currency: 'IDR',
      risk_level: 'low',
      tenor_months: 36,
      coupon_rate: 0.061,
      meta: { coupon_type: 'fixed' },
    },
    {
      category: 'gold',
      symbol: 'XAU-IDR',
      name: 'Emas (per gram)',
      provider: 'GoldSpot',
      currency: 'IDR',
      risk_level: 'medium',
      meta: { unit: 'gram' },
    },
  ];

  for (const product of investmentProducts) {
    const upserted = await prisma.investmentProduct.upsert({
      where: { symbol: product.symbol },
      update: product,
      create: product,
    });
    console.log(`Upserted investment product: ${upserted.symbol}`);
  }

  // 3. Seed User
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password_placeholder',
      phone: '08123456789',
      birthday: new Date('1995-01-01'),
      investment_portfolio_value: 15000000,
      financial_goal_name: 'Beli Rumah',
      financial_goal_target: 500000000,
      financial_goal_saved: 50000000,
    },
  });
  console.log(`Upserted user: ${user.email}`);

  // 4. Seed UserCategory
  const userCategory = await prisma.userCategory.upsert({
    where: {
      user_id_name: {
        user_id: user.id,
        name: 'Kopi Susu'
      }
    },
    update: {},
    create: {
      user_id: user.id,
      name: 'Kopi Susu',
    },
  });
  console.log(`Upserted user category: ${userCategory.name}`);

  // Fetch a base category for relations
  const makananCategory = await prisma.category.findUnique({ where: { name: 'makanan' } });

  // 5. Seed Transaction
  const transaction = await prisma.transaction.create({
    data: {
      user_id: user.id,
      transaction_type: 'expense',
      category_id: makananCategory.id,
      user_category_id: userCategory.id,
      description: 'Makan Siang & Kopi',
      amount: 55000,
      payment_method: 'e_wallet',
      transaction_date: new Date(),
      category_predicted: 'makanan',
      confidence_score: 0.95,
      is_anomaly: false,
    },
  });
  console.log(`Created transaction: ${transaction.id}`);

  // 6. Seed TransactionFeedback
  const feedback = await prisma.transactionFeedback.create({
    data: {
      user_id: user.id,
      transaction_id: transaction.id,
      corrected_category_id: makananCategory.id,
      feedback_type: 'correction',
    },
  });
  console.log(`Created transaction feedback: ${feedback.id}`);

  // 7. Seed Budget
  const budget = await prisma.budget.upsert({
    where: {
      user_id_category_id_period: {
        user_id: user.id,
        category_id: makananCategory.id,
        period: '2023-10', // Example period
      }
    },
    update: {},
    create: {
      user_id: user.id,
      category_id: makananCategory.id,
      amount: 1500000,
      period: '2023-10',
      start_date: new Date('2023-10-01'),
      end_date: new Date('2023-10-31'),
    },
  });
  console.log(`Upserted budget for category: ${budget.category_id}`);

  // 8. Seed Alert
  const alert = await prisma.alert.create({
    data: {
      user_id: user.id,
      category_id: makananCategory.id,
      budget_id: budget.id,
      level: 'warning',
      message: 'Pengeluaran makanan Anda sudah mencapai 70% dari budget bulan ini.',
      percentage: 75.5,
    },
  });
  console.log(`Created alert: ${alert.id}`);

  // 9. Seed Recommendation
  const recommendation = await prisma.recommendation.create({
    data: {
      user_id: user.id,
      category_id: makananCategory.id,
      type: 'budget_optimization',
      message: 'Kurangi pengeluaran kopi susu Anda untuk berhemat Rp 200.000 bulan ini.',
      priority: 'medium',
      status: 'active',
    },
  });
  console.log(`Created recommendation: ${recommendation.id}`);

  // 10. Seed UserRiskProfile
  const riskProfile = await prisma.userRiskProfile.create({
    data: {
      user_id: user.id,
      risk_level: 'medium',
      score: 65,
      answer: { q1: 'a', q2: 'b', q3: 'c' },
    },
  });
  console.log(`Created risk profile for user: ${user.id}`);

  // 11. Seed RiskProfileAnswer
  const riskProfileAnswer = await prisma.riskProfileAnswer.create({
    data: {
      profile_user_id: riskProfile.id,
      question: 'Q1',
      answer: 'a',
    },
  });
  console.log(`Created risk profile answer: ${riskProfileAnswer.id}`);

  // 12. Seed InvestmentRecommendation
  const investmentRecommendation = await prisma.investmentRecommendation.create({
    data: {
      user_id: user.id,
      risk_profile_id: riskProfile.id,
      instrument_type: 'mutual_fund',
      instrument_name: 'Reksa Dana Pendapatan Tetap',
      expected_return_min: 0.05,
      expected_return_max: 0.08,
    },
  });
  console.log(`Created investment recommendation: ${investmentRecommendation.id}`);

  // 13. Seed PortfolioPosition
  // Fetch a product first
  const bbcaProduct = await prisma.investmentProduct.findUnique({ where: { symbol: 'BBCA' } });

  const portfolioPosition = await prisma.portfolioPosition.upsert({
    where: {
      user_id_product_id: {
        user_id: user.id,
        product_id: bbcaProduct.id,
      }
    },
    update: {},
    create: {
      user_id: user.id,
      product_id: bbcaProduct.id,
      quantity: 1000,
      avg_cost: 8500,
      purchased_at: new Date('2023-01-15'),
    },
  });
  console.log(`Upserted portfolio position for product: ${portfolioPosition.product_id}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
