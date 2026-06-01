import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed Categories
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
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    console.log(`Upserted category: ${category.name}`);
  }

  // Seed Investment Products (minimal catalog)
  const investmentProducts = [
    // Stocks
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

    // Mutual funds
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

    // Bonds
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

    // Gold
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
    console.log(`Upserted investment product: ${upserted.symbol} (${upserted.category})`);
  }

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
