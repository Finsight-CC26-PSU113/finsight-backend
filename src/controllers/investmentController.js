import { successResponse, errorResponse } from '../utils/response.js';
import prisma from '../config/database.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_V4_REGEX.test(value);

const investmentProducts = [
  {
    id: 'sbr',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    badgeText: 'Rendah',
    badgeColor: 'text-blue-600 bg-blue-50',
    borderColor: 'border-b-blue-600',
    title: 'SBR (Savings Bond Ritel)',
    desc: 'Surat Berharga Negara dengan kupon mengambang.',
    detail1Label: 'EST. RETURN',
    detail1Value: '6.40% p.a',
    detail2Label: 'TENOR',
    detail2Value: '2 Tahun',
    fullDesc:
      'Surat Berharga Negara (SBN) ritel yang diterbitkan oleh Pemerintah Indonesia khusus untuk warga negara Indonesia. Produk ini dijamin 100% aman oleh undang-undang, sehingga hampir bebas risiko gagal bayar. Sangat direkomendasikan untuk diversifikasi pasif jangka panjang Anda.',
    minPurchase: 'Rp 1.000.000',
    riskLevel: 'Rendah',
    features: [
      'Imbal hasil berupa kupon bulanan yang langsung masuk rekening.',
      'Likuiditas terjamin dengan opsi Early Redemption (pencairan awal setelah 1 tahun).',
      'Membantu pembiayaan pembangunan infrastruktur negara secara langsung.',
    ],
  },
  {
    id: 'rdpu',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    badgeText: 'Rendah',
    badgeColor: 'text-green-600 bg-green-50',
    borderColor: 'border-b-green-400',
    title: 'RDPU',
    desc: 'Reksa Dana Pasar Uang. Likuiditas tinggi & stabil.',
    detail1Label: 'EST. RETURN',
    detail1Value: '4.85% p.a',
    detail2Label: 'MIN. BELI',
    detail2Value: 'Rp 10.000',
    fullDesc:
      'Reksa Dana Pasar Uang menginvestasikan dana Anda ke instrumen pasar uang berjangka pendek kurang dari 1 tahun, seperti deposito bank berkualitas tinggi dan surat berharga pasar uang. Sangat aman dan stabil untuk parkir dana darurat.',
    minPurchase: 'Rp 10.000',
    riskLevel: 'Rendah',
    features: [
      'Fleksibilitas pencairan harian tanpa penalti.',
      'Nilai aset bersih (NAB) tumbuh stabil setiap hari tanpa fluktuasi tajam.',
      'Tanpa minimum jangka waktu penahanan dana.',
    ],
  },
  {
    id: 'emas',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    badgeText: 'Sedang',
    badgeColor: 'text-orange-600 bg-orange-50',
    borderColor: 'border-b-orange-300',
    title: 'Emas Digital',
    desc: 'Investasi fisik emas secara digital. Lindung nilai inflasi.',
    detail1Label: 'PERGERAKAN',
    detail1Value: '+8.2% / thn',
    detail2Label: 'HARGA BELI',
    detail2Value: 'Rp 1.120k/g',
    fullDesc:
      'Investasi emas fisik murni 24 karat yang disimpan secara aman di brankas bersertifikat (seperti ANTAM atau Pegadaian), namun dikelola dan ditransaksikan secara digital mulai dari Rp 10.000. Sangat baik sebagai pelindung nilai (hedge) terhadap inflasi jangka panjang.',
    minPurchase: 'Rp 10.000',
    riskLevel: 'Sedang',
    features: [
      'Emas fisik dapat dicetak dan dikirim ke rumah Anda jika gramasi mencukupi.',
      'Harga emas terupdate secara real-time mengikuti pergerakan pasar global.',
      'Lindung nilai yang terbukti stabil saat kondisi pasar ekonomi mengalami ketidakpastian.',
    ],
  },
];

const educationContent = [
  {
    id: 1,
    title: 'Apa itu Diversifikasi?',
    desc: 'Strategi membagi modal ke berbagai aset untuk mengurangi risiko.',
    content:
      'Diversifikasi adalah praktik menyebarkan investasi Anda ke berbagai instrumen keuangan, industri, dan kategori lainnya. Tujuannya adalah untuk memaksimalkan pengembalian dengan berinvestasi di berbagai area yang masing-masing akan bereaksi secara berbeda terhadap peristiwa pasar yang sama.\n\nDengan membagi investasi ke berbagai kelas aset seperti saham, obligasi, reksa dana, dan emas, jika satu aset mengalami penurunan nilai, aset lainnya dapat mengimbangi kerugian tersebut. Ini adalah pilar dasar dalam manajemen risiko portofolio keuangan premium.',
  },
  {
    id: 2,
    title: 'Kekuatan Compounding',
    desc: 'Bagaimana bunga berbunga membuat aset Anda tumbuh eksponensial.',
    content:
      'Compounding effect (efek bunga berbunga) adalah proses di mana nilai investasi Anda tumbuh secara eksponensial karena Anda menghasilkan keuntungan atas keuntungan investasi sebelumnya, selain atas modal awal.\n\nSebagai contoh, jika Anda menginvestasikan Rp 10.000.000 dengan imbal hasil 10% per tahun, di akhir tahun pertama investasi Anda bernilai Rp 11.000.000. Di tahun kedua, imbal hasil 10% dihitung dari Rp 11.000.000 (bukan Rp 10.000.000 awal), menghasilkan Rp 12.100.000. Seiring berjalannya waktu (10, 20, atau 30 tahun), efek ini akan menghasilkan pelipatgandaan kekayaan yang luar biasa. Kunci utamanya adalah memulai sedini mungkin!',
  },
];

const INVESTMENT_CATEGORIES = [
  { id: 'stock', label: 'Saham' },
  { id: 'mutual_fund', label: 'Reksa Dana' },
  { id: 'bond', label: 'Obligasi' },
  { id: 'gold', label: 'Emas' },
];

// -----------------------------------------------------------------------------
// Quotes provider (stub + caching). Swap this with real provider later.
// -----------------------------------------------------------------------------

const QUOTE_TTL_MS = 60_000;
const quoteCache = new Map(); // symbol -> { value, expiresAt }

const nowEpoch = () => Date.now();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hashString = (value) => {
  const str = String(value || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildStubQuote = (symbol, currency = 'IDR') => {
  const baseSeed = hashString(symbol);
  const minuteBucket = Math.floor(nowEpoch() / 60_000);
  const wobbleSeed = (baseSeed + minuteBucket) % 97;

  // Generate different typical ranges for each asset type by symbol prefix.
  let basePrice = 10_000;
  if (symbol === 'XAU-IDR') basePrice = 1_100_000;
  if (symbol.startsWith('SBN-') || symbol.startsWith('ORI')) basePrice = 1_000_000;
  if (symbol.startsWith('RD')) basePrice = 1_500;

  const variation = (wobbleSeed - 48) / 480; // ~[-0.1, 0.1]
  const price = Math.round(basePrice * (1 + variation));

  return {
    symbol,
    price: clamp(price, 1, Number.MAX_SAFE_INTEGER),
    currency,
    as_of: new Date().toISOString(),
    source: 'stub',
  };
};

const getQuotesForSymbols = async (symbols = []) => {
  const unique = Array.from(new Set(symbols.map((s) => String(s || '').trim()).filter(Boolean)));
  const results = [];

  for (const symbol of unique) {
    const cached = quoteCache.get(symbol);
    if (cached && cached.expiresAt > nowEpoch()) {
      results.push(cached.value);
      continue;
    }

    const product = await prisma.investmentProduct.findUnique({
      where: { symbol },
      select: { currency: true },
    });

    const quote = buildStubQuote(symbol, product?.currency || 'IDR');
    quoteCache.set(symbol, { value: quote, expiresAt: nowEpoch() + QUOTE_TTL_MS });
    results.push(quote);
  }

  return results;
};

export const getInvestments = async (req, res, next) => {
  try {
    // For now, derive portfolio value from tracked positions when available.
    const positions = await prisma.portfolioPosition.findMany({
      where: { user_id: req.user.id },
      include: { product: true },
    });

    const symbols = positions.map((p) => p.product?.symbol).filter(Boolean);
    const quotes = await getQuotesForSymbols(symbols);
    const quoteBySymbol = quotes.reduce((map, q) => {
      map[q.symbol] = q;
      return map;
    }, {});

    const portfolioValue = positions.reduce((sum, pos) => {
      const symbol = pos.product?.symbol;
      const quote = symbol ? quoteBySymbol[symbol] : null;
      const price = Number(quote?.price || 0);
      const qty = Number(pos.quantity || 0);
      return sum + price * qty;
    }, 0);

    const financialGoalTarget = Number(req.user?.financial_goal_target || 0);
    const financialGoalSaved = Number(req.user?.financial_goal_saved || 0);

    return successResponse(res, 200, 'Investments retrieved successfully', {
      // legacy placeholder products kept for backward compatibility until frontend is migrated
      products: investmentProducts,
      education: educationContent,
      categories: INVESTMENT_CATEGORIES,
      portfolio: {
        value: portfolioValue,
        has_portfolio: portfolioValue > 0,
        financial_goal: {
          name: req.user?.financial_goal_name || 'Dana Darurat',
          target: financialGoalTarget,
          saved: financialGoalSaved,
          progress:
            financialGoalTarget > 0
              ? Math.min(100, (financialGoalSaved / financialGoalTarget) * 100)
              : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInvestmentProducts = async (req, res, next) => {
  try {
    const category = String(req.query.category || '').trim();
    const search = String(req.query.search || '').trim();
    const sort = String(req.query.sort || '').trim();

    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Basic sorting; quotes-based sorting can be done client-side after fetching quotes.
    const orderBy = [];
    if (sort === 'risk_asc') orderBy.push({ risk_level: 'asc' });
    if (sort === 'risk_desc') orderBy.push({ risk_level: 'desc' });
    if (sort === 'return_1y_asc') orderBy.push({ return_1y: 'asc' });
    if (sort === 'return_1y_desc') orderBy.push({ return_1y: 'desc' });
    if (orderBy.length === 0) orderBy.push({ name: 'asc' });

    const products = await prisma.investmentProduct.findMany({
      where,
      orderBy,
    });

    return successResponse(res, 200, 'Investment products retrieved successfully', { products });
  } catch (err) {
    next(err);
  }
};

export const getInvestmentProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Look up by UUID primary key, or fall back to the unique `symbol` so that
    // non-UUID identifiers (e.g. "sbr") return a clean 404 instead of a raw DB error.
    const product = isUuid(id)
      ? await prisma.investmentProduct.findUnique({ where: { id } })
      : await prisma.investmentProduct.findUnique({ where: { symbol: id } });

    if (!product) {
      return errorResponse(res, 404, 'Investment product not found');
    }

    return successResponse(res, 200, 'Investment product retrieved successfully', { product });
  } catch (err) {
    next(err);
  }
};

export const getInvestmentQuotes = async (req, res, next) => {
  try {
    const symbolsRaw = String(req.query.symbols || '');
    const symbols = symbolsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const quotes = await getQuotesForSymbols(symbols);
    return successResponse(res, 200, 'Investment quotes retrieved successfully', { quotes });
  } catch (err) {
    next(err);
  }
};

export const getInvestmentPortfolio = async (req, res, next) => {
  try {
    const positions = await prisma.portfolioPosition.findMany({
      where: { user_id: req.user.id },
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });

    const symbols = positions.map((p) => p.product?.symbol).filter(Boolean);
    const quotes = await getQuotesForSymbols(symbols);
    const quoteBySymbol = quotes.reduce((map, q) => {
      map[q.symbol] = q;
      return map;
    }, {});

    const enriched = positions.map((pos) => {
      const symbol = pos.product?.symbol;
      const quote = symbol ? quoteBySymbol[symbol] : null;
      const price = Number(quote?.price || 0);
      const qty = Number(pos.quantity || 0);
      const marketValue = price * qty;

      const avgCost = pos.avg_cost !== null && pos.avg_cost !== undefined ? Number(pos.avg_cost) : null;
      const pnl = avgCost !== null ? marketValue - avgCost * qty : null;

      return {
        id: pos.id,
        quantity: Number(pos.quantity),
        avg_cost: avgCost,
        purchased_at: pos.purchased_at,
        product: pos.product,
        quote,
        market_value: marketValue,
        pnl,
      };
    });

    const totalValue = enriched.reduce((sum, item) => sum + Number(item.market_value || 0), 0);
    const totalPnl = enriched.reduce((sum, item) => sum + Number(item.pnl || 0), 0);

    return successResponse(res, 200, 'Investment portfolio retrieved successfully', {
      portfolio: {
        value: totalValue,
        pnl: totalPnl,
        positions: enriched,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createPortfolioPosition = async (req, res, next) => {
  try {
    const { product_id, quantity, avg_cost, purchased_at } = req.body || {};
    const created = await prisma.portfolioPosition.upsert({
      where: {
        user_id_product_id: {
          user_id: req.user.id,
          product_id,
        },
      },
      update: {
        quantity,
        avg_cost: avg_cost ?? null,
        purchased_at: purchased_at ? new Date(purchased_at) : null,
      },
      create: {
        user_id: req.user.id,
        product_id,
        quantity,
        avg_cost: avg_cost ?? null,
        purchased_at: purchased_at ? new Date(purchased_at) : null,
      },
      include: { product: true },
    });

    return successResponse(res, 201, 'Portfolio position saved successfully', { position: created });
  } catch (err) {
    next(err);
  }
};

export const updatePortfolioPosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, avg_cost, purchased_at } = req.body || {};

    const existing = await prisma.portfolioPosition.findUnique({ where: { id } });
    if (!existing || existing.user_id !== req.user.id) {
      return successResponse(res, 404, 'Position not found');
    }

    const updated = await prisma.portfolioPosition.update({
      where: { id },
      data: {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(avg_cost !== undefined ? { avg_cost: avg_cost ?? null } : {}),
        ...(purchased_at !== undefined ? { purchased_at: purchased_at ? new Date(purchased_at) : null } : {}),
      },
      include: { product: true },
    });

    return successResponse(res, 200, 'Portfolio position updated successfully', { position: updated });
  } catch (err) {
    next(err);
  }
};

export const deletePortfolioPosition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.portfolioPosition.findUnique({ where: { id } });
    if (!existing || existing.user_id !== req.user.id) {
      return successResponse(res, 404, 'Position not found');
    }

    await prisma.portfolioPosition.delete({ where: { id } });
    return successResponse(res, 200, 'Portfolio position deleted successfully');
  } catch (err) {
    next(err);
  }
};
