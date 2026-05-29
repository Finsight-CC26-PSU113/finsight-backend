import { successResponse } from '../utils/response.js';

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

export const getInvestments = async (req, res, next) => {
  try {
    const portfolioValue = Number(req.user?.investment_portfolio_value || 0);
    const financialGoalTarget = Number(req.user?.financial_goal_target || 0);
    const financialGoalSaved = Number(req.user?.financial_goal_saved || 0);

    return successResponse(res, 200, 'Investments retrieved successfully', {
      products: investmentProducts,
      education: educationContent,
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
