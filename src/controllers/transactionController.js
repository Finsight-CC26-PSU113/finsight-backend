import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { checkBudgetThresholds } from '../utils/alertService.js';

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || process.env.ML_SERVICE_URL || 'http://localhost:8000';
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === 'string' && UUID_V4_REGEX.test(value);

const validateTransactionId = (res, id) => {
  if (!isUuid(id)) {
    return errorResponse(res, 400, 'Invalid transaction ID');
  }

  return null;
};

const validateCategoryId = (res, id) => {
  if (!isUuid(id)) {
    return errorResponse(res, 400, 'Invalid category ID');
  }

  return null;
};

// Fallback rule-based classifier if ML service is down
const getFallbackPrediction = (description) => {
  const desc = (description || '').toLowerCase();
  if (
    desc.includes('makan') ||
    desc.includes('minum') ||
    desc.includes('kopi') ||
    desc.includes('warung') ||
    desc.includes('resto') ||
    desc.includes('bakso') ||
    desc.includes('cafe')
  ) {
    return { category_predicted: 'makanan', confidence_score: 0.88 };
  }
  if (
    desc.includes('grab') ||
    desc.includes('gojek') ||
    desc.includes('ojek') ||
    desc.includes('trans') ||
    desc.includes('bus') ||
    desc.includes('kereta') ||
    desc.includes('bensin') ||
    desc.includes('parkir') ||
    desc.includes('mrt')
  ) {
    return { category_predicted: 'transport', confidence_score: 0.92 };
  }
  if (
    desc.includes('bioskop') ||
    desc.includes('nonton') ||
    desc.includes('game') ||
    desc.includes('karaoke') ||
    desc.includes('wisata') ||
    desc.includes('hiburan') ||
    desc.includes('netflix')
  ) {
    return { category_predicted: 'hiburan', confidence_score: 0.85 };
  }
  if (
    desc.includes('belanja') ||
    desc.includes('tokopedia') ||
    desc.includes('shopee') ||
    desc.includes('kaos') ||
    desc.includes('baju') ||
    desc.includes('sepatu') ||
    desc.includes('mall')
  ) {
    return { category_predicted: 'belanja', confidence_score: 0.87 };
  }
  if (
    desc.includes('obat') ||
    desc.includes('dokter') ||
    desc.includes('klinik') ||
    desc.includes('sakit') ||
    desc.includes('kesehatan') ||
    desc.includes('vitamin') ||
    desc.includes('apotek')
  ) {
    return { category_predicted: 'kesehatan', confidence_score: 0.9 };
  }
  if (
    desc.includes('listrik') ||
    desc.includes('air') ||
    desc.includes('wifi') ||
    desc.includes('internet') ||
    desc.includes('pulsa') ||
    desc.includes('tagihan') ||
    desc.includes('bpjs')
  ) {
    return { category_predicted: 'tagihan', confidence_score: 0.95 };
  }
  return { category_predicted: 'lainnya', confidence_score: 0.5 };
};

// Helper function to call FastAPI predict
const callMLClassifier = async (description, amount) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: description,
        amount: Number(amount),
      }),
      signal: AbortSignal.timeout(3000), // 3-second timeout
    });

    if (response.ok) {
      const result = await response.json();
      return {
        category_predicted: result.category || result.category_predicted || 'lainnya',
        confidence_score: result.confidence || result.confidence_score || 0.7,
        is_anomaly: result.is_anomaly || false,
        anomaly_score: result.anomaly_score || 0,
      };
    }
  } catch (err) {
    console.warn(
      'FastAPI classifier connection failed, using local rule-based fallback.',
      err.message
    );
  }

  // Fallback if network fails
  const fallback = getFallbackPrediction(description);
  return {
    category_predicted: fallback.category_predicted,
    confidence_score: fallback.confidence_score,
    is_anomaly: false,
    anomaly_score: 0,
  };
};

export const getTransactions = async (req, res, next) => {
  try {
    const { transaction_type, category_id, start_date, end_date } = req.query;
    const filter = { user_id: req.user.id };

    if (transaction_type) {
      filter.transaction_type = transaction_type;
    }
    if (category_id) {
      filter.category_id = category_id;
    }
    if (start_date || end_date) {
      filter.transaction_date = {};
      if (start_date) {
        filter.transaction_date.gte = new Date(start_date);
      }
      if (end_date) {
        filter.transaction_date.lte = new Date(end_date);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: filter,
      include: {
        category: true,
        user_category: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });

    return successResponse(res, 200, 'Transactions retrieved successfully', { transactions });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (validateTransactionId(res, id)) {
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        user_category: true,
      },
    });

    if (!transaction || transaction.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    return successResponse(res, 200, 'Transaction retrieved successfully', { transaction });
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      transaction_type,
      amount,
      payment_method,
      transaction_date,
      category_id,
      user_category_id,
      description,
    } = req.body;

    let targetCategoryId = category_id;
    let mlData = {};

    // Auto-classify only for expenses if no category_id and no user_category_id is provided
    if (transaction_type === 'expense' && !targetCategoryId && !user_category_id && description) {
      mlData = await callMLClassifier(description, amount);
      const matchedCategory = await prisma.category.findFirst({
        where: { name: mlData.category_predicted },
      });
      if (matchedCategory) {
        targetCategoryId = matchedCategory.id;
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        user_id: req.user.id,
        transaction_type,
        amount,
        payment_method,
        transaction_date: new Date(transaction_date),
        category_id: targetCategoryId || null,
        user_category_id: user_category_id || null,
        description: description || null,
        category_predicted: mlData.category_predicted || null,
        confidence_score: mlData.confidence_score || null,
        is_anomaly: mlData.is_anomaly || false,
        anomaly_score: mlData.anomaly_score || null,
      },
      include: {
        category: true,
        user_category: true,
      },
    });

    // If it is an expense and has a category, check budget thresholds
    if (transaction_type === 'expense' && targetCategoryId) {
      await checkBudgetThresholds(req.user.id, targetCategoryId, transaction_date);
    }

    return successResponse(res, 201, 'Transaction created successfully', { transaction });
  } catch (err) {
    next(err);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      transaction_type,
      amount,
      payment_method,
      transaction_date,
      category_id,
      user_category_id,
      description,
    } = req.body;

    if (validateTransactionId(res, id)) {
      return;
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        transaction_type:
          transaction_type === undefined ? existing.transaction_type : transaction_type,
        amount: amount === undefined ? existing.amount : amount,
        payment_method: payment_method === undefined ? existing.payment_method : payment_method,
        transaction_date:
          transaction_date === undefined ? existing.transaction_date : new Date(transaction_date),
        category_id: category_id === undefined ? existing.category_id : category_id,
        user_category_id:
          user_category_id === undefined ? existing.user_category_id : user_category_id,
        description: description === undefined ? existing.description : description,
      },
      include: {
        category: true,
        user_category: true,
      },
    });

    // Check budget thresholds if expense and category exists
    if (updated.transaction_type === 'expense' && updated.category_id) {
      await checkBudgetThresholds(req.user.id, updated.category_id, updated.transaction_date);
    }

    return successResponse(res, 200, 'Transaction updated successfully', { transaction: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (validateTransactionId(res, id)) {
      return;
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return successResponse(res, 200, 'Transaction deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const classifyTransaction = async (req, res, next) => {
  try {
    const { description, amount } = req.body;
    const prediction = await callMLClassifier(description, amount);
    return successResponse(res, 200, 'Transaction classified successfully', {
      category_predicted: prediction.category_predicted,
      confidence_score: prediction.confidence_score,
      is_anomaly: prediction.is_anomaly,
      anomaly_score: prediction.anomaly_score,
    });
  } catch (err) {
    next(err);
  }
};

export const overrideCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { corrected_category_id, feedback_type } = req.body;

    if (validateTransactionId(res, id)) {
      return;
    }

    if (validateCategoryId(res, corrected_category_id)) {
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: corrected_category_id },
    });

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Update transaction category
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        category_id: corrected_category_id,
        user_category_id: null, // Clear user custom category if system category overrides it
      },
      include: {
        category: true,
        user_category: true,
      },
    });

    // Log feedback loop
    await prisma.transactionFeedback.create({
      data: {
        user_id: req.user.id,
        transaction_id: id,
        corrected_category_id: corrected_category_id,
        feedback_type: feedback_type || 'user_override',
      },
    });

    // Check budget thresholds for the new overridden category
    await checkBudgetThresholds(req.user.id, corrected_category_id, updated.transaction_date);

    return successResponse(res, 200, 'Category overridden successfully and feedback logged', {
      transaction: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const submitAnomalyFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_anomaly } = req.body;

    if (validateTransactionId(res, id)) {
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.user_id !== req.user.id) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        is_anomaly,
      },
    });

    return successResponse(res, 200, 'Anomaly feedback submitted successfully');
  } catch (err) {
    next(err);
  }
};
