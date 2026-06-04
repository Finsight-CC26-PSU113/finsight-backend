import prisma from '../config/database.js';
import { successResponse } from '../utils/response.js';

// Derive a risk level from the questionnaire total score (mirrors the frontend
// thresholds: <=13 Konservatif, 14-19 Moderat, >=20 Agresif).
const deriveRiskLevel = (score) => {
  if (score <= 13) return 'low';
  if (score <= 19) return 'medium';
  return 'high';
};

// Static investment suggestions keyed by risk level. expected_return_* in % p.a.
const RECOMMENDATIONS_BY_LEVEL = {
  low: [
    { instrument_type: 'mutual_fund', instrument_name: 'Reksa Dana Pasar Uang (RDPU)', expected_return_min: 4.0, expected_return_max: 5.5 },
    { instrument_type: 'bond', instrument_name: 'SBN Ritel (SBR/ORI)', expected_return_min: 6.0, expected_return_max: 6.6 },
    { instrument_type: 'gold', instrument_name: 'Emas Digital', expected_return_min: 5.0, expected_return_max: 8.0 },
  ],
  medium: [
    { instrument_type: 'mutual_fund', instrument_name: 'Reksa Dana Pendapatan Tetap', expected_return_min: 6.0, expected_return_max: 8.0 },
    { instrument_type: 'bond', instrument_name: 'SBN Ritel (ORI)', expected_return_min: 6.0, expected_return_max: 6.6 },
    { instrument_type: 'stock', instrument_name: 'Reksa Dana Saham Indeks (IDX30)', expected_return_min: 8.0, expected_return_max: 12.0 },
    { instrument_type: 'gold', instrument_name: 'Emas Digital', expected_return_min: 5.0, expected_return_max: 8.0 },
  ],
  high: [
    { instrument_type: 'stock', instrument_name: 'Saham Blue Chip (BBCA, TLKM)', expected_return_min: 10.0, expected_return_max: 18.0 },
    { instrument_type: 'stock', instrument_name: 'Reksa Dana Saham', expected_return_min: 9.0, expected_return_max: 15.0 },
    { instrument_type: 'mutual_fund', instrument_name: 'Reksa Dana Campuran', expected_return_min: 7.0, expected_return_max: 11.0 },
  ],
};

const serializeProfile = (profile) => ({
  id: profile.id,
  risk_level: profile.risk_level,
  score: profile.score,
  answers: profile.answer,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
  recommendations: (profile.investment_recommendations || []).map((r) => ({
    id: r.id,
    instrument_type: r.instrument_type,
    instrument_name: r.instrument_name,
    expected_return_min: r.expected_return_min,
    expected_return_max: r.expected_return_max,
  })),
});

export const saveRiskProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { score, answers = {} } = req.body;
    const riskLevel = req.body.risk_level || deriveRiskLevel(Number(score));

    const answerRows = Object.entries(answers).map(([question, answer]) => ({
      question: `q${question}`.slice(0, 10),
      answer: String(answer).slice(0, 5),
    }));
    const recs = RECOMMENDATIONS_BY_LEVEL[riskLevel] || RECOMMENDATIONS_BY_LEVEL.low;

    // Replace any previous profile so each user keeps a single, latest profile.
    // Cascade deletes its answers + investment recommendations.
    await prisma.userRiskProfile.deleteMany({ where: { user_id: userId } });

    const profile = await prisma.userRiskProfile.create({
      data: {
        user_id: userId,
        risk_level: riskLevel,
        score: Number(score),
        answer: answers,
        answers: { create: answerRows },
        investment_recommendations: {
          create: recs.map((r) => ({ user_id: userId, ...r })),
        },
      },
      include: { investment_recommendations: true },
    });

    return successResponse(res, 201, 'Risk profile saved successfully', {
      profile: serializeProfile(profile),
    });
  } catch (err) {
    next(err);
  }
};

export const getRiskProfile = async (req, res, next) => {
  try {
    const profile = await prisma.userRiskProfile.findFirst({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: { investment_recommendations: true },
    });

    return successResponse(res, 200, 'Risk profile retrieved successfully', {
      profile: profile ? serializeProfile(profile) : null,
    });
  } catch (err) {
    next(err);
  }
};
