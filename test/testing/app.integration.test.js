import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

const mockAuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Budi Santoso',
  email: 'budi@example.com',
};

const mockToken = 'mock-jwt-token';
const mockHashedPassword = 'hashed-password';
const mockCategoryId = '22222222-2222-4222-8222-222222222222';
const mockTransactionId = '33333333-3333-4333-8333-333333333333';
const mockBudgetId = '44444444-4444-4444-8444-444444444444';
const mockRecommendationId = '55555555-5555-4555-8555-555555555555';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  userCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  transactionFeedback: {
    create: jest.fn(),
  },
  budget: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recommendation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  alert: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockCheckBudgetThresholds = jest.fn().mockResolvedValue(undefined);

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

let app;

beforeAll(async () => {
  jest.doMock('../../src/config/database.js', () => ({
    __esModule: true,
    default: mockPrisma,
  }));

  jest.doMock('../../src/middleware/auth.js', () => ({
    __esModule: true,
    default: (req, res, next) => {
      req.user = mockAuthUser;
      next();
    },
  }));

  jest.doMock('../../src/utils/alertService.js', () => ({
    checkBudgetThresholds: mockCheckBudgetThresholds,
  }));

  app = (await import('../../src/app.js')).default;
});

describe('Finsight API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const bcryptMock = jest.requireMock('bcrypt');
    const jwtMock = jest.requireMock('jsonwebtoken');

    jwtMock.sign.mockReturnValue(mockToken);
    bcryptMock.hash.mockResolvedValue(mockHashedPassword);
    bcryptMock.compare.mockResolvedValue(true);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        category: 'makanan',
        confidence: 0.94,
        is_anomaly: false,
        anomaly_score: 0.02,
      }),
    });

    mockPrisma.user.findUnique.mockImplementation(async ({ where }) => {
      if (where?.email === 'budi@example.com') {
        return {
          id: mockAuthUser.id,
          name: mockAuthUser.name,
          email: mockAuthUser.email,
          password: mockHashedPassword,
          phone: null,
          birthday: null,
          avatar: null,
          created_at: new Date('2026-05-13T00:00:00.000Z'),
          updated_at: new Date('2026-05-13T00:00:00.000Z'),
        };
      }

      if (where?.id === mockAuthUser.id) {
        return {
          ...mockAuthUser,
          password: mockHashedPassword,
          phone: null,
          birthday: null,
          avatar: null,
          created_at: new Date('2026-05-13T00:00:00.000Z'),
          updated_at: new Date('2026-05-13T00:00:00.000Z'),
        };
      }

      return null;
    });

    mockPrisma.user.create.mockImplementation(async ({ data }) => ({
      id: mockAuthUser.id,
      name: data.name,
      email: data.email,
      password: mockHashedPassword,
      phone: data.phone ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      avatar: null,
      created_at: new Date('2026-05-13T00:00:00.000Z'),
      updated_at: new Date('2026-05-13T00:00:00.000Z'),
    }));

    mockPrisma.user.update.mockImplementation(async ({ data }) => ({
      id: mockAuthUser.id,
      name: data.name ?? mockAuthUser.name,
      email: mockAuthUser.email,
      password: mockHashedPassword,
      phone: data.phone ?? null,
      birthday: data.birthday ?? null,
      avatar: null,
      created_at: new Date('2026-05-13T00:00:00.000Z'),
      updated_at: new Date('2026-05-13T00:00:00.000Z'),
    }));

    mockPrisma.category.findMany.mockResolvedValue([
      { id: mockCategoryId, name: 'makanan' },
      { id: '66666666-6666-4666-8666-666666666666', name: 'transport' },
    ]);

    mockPrisma.category.findUnique.mockImplementation(async ({ where }) => {
      if (where?.id === mockCategoryId) {
        return { id: mockCategoryId, name: 'makanan' };
      }

      if (where?.id === '66666666-6666-4666-8666-666666666666') {
        return { id: '66666666-6666-4666-8666-666666666666', name: 'transport' };
      }

      return null;
    });

    mockPrisma.category.findFirst.mockImplementation(async ({ where }) => {
      if (where?.name === 'makanan') {
        return { id: mockCategoryId, name: 'makanan' };
      }

      return null;
    });

    mockPrisma.userCategory.findMany.mockResolvedValue([
      {
        id: '77777777-7777-4777-8777-777777777777',
        user_id: mockAuthUser.id,
        name: 'Makan Siang',
        created_at: new Date('2026-05-13T00:00:00.000Z'),
      },
    ]);

    mockPrisma.userCategory.findUnique.mockImplementation(async ({ where }) => {
      if (where?.id === '77777777-7777-4777-8777-777777777777') {
        return {
          id: '77777777-7777-4777-8777-777777777777',
          user_id: mockAuthUser.id,
          name: 'Makan Siang',
          created_at: new Date('2026-05-13T00:00:00.000Z'),
        };
      }

      if (where?.user_id_name?.user_id === mockAuthUser.id) {
        return null;
      }

      return null;
    });

    mockPrisma.userCategory.create.mockImplementation(async ({ data }) => ({
      id: '88888888-8888-4888-8888-888888888888',
      user_id: data.user_id,
      name: data.name,
      created_at: new Date('2026-05-13T00:00:00.000Z'),
    }));

    mockPrisma.userCategory.update.mockImplementation(async ({ data }) => ({
      id: '77777777-7777-4777-8777-777777777777',
      user_id: mockAuthUser.id,
      name: data.name,
      created_at: new Date('2026-05-13T00:00:00.000Z'),
    }));

    mockPrisma.userCategory.delete.mockResolvedValue({});

    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: mockTransactionId,
        user_id: mockAuthUser.id,
        transaction_type: 'expense',
        category_id: mockCategoryId,
        user_category_id: null,
        description: 'warteg berkah jaya',
        amount: '15000.00',
        payment_method: 'cash',
        transaction_date: new Date('2026-05-22T00:00:00.000Z'),
        category_predicted: 'makanan',
        confidence_score: 0.94,
        is_anomaly: false,
        anomaly_score: 0.02,
        created_at: new Date('2026-05-22T00:00:00.000Z'),
        category: { id: mockCategoryId, name: 'makanan' },
        user_category: null,
      },
    ]);

    mockPrisma.transaction.findUnique.mockImplementation(async ({ where }) => {
      if (where?.id === mockTransactionId) {
        return {
          id: mockTransactionId,
          user_id: mockAuthUser.id,
          transaction_type: 'expense',
          category_id: mockCategoryId,
          user_category_id: null,
          description: 'warteg berkah jaya',
          amount: '15000.00',
          payment_method: 'cash',
          transaction_date: new Date('2026-05-22T00:00:00.000Z'),
          category_predicted: 'makanan',
          confidence_score: 0.94,
          is_anomaly: false,
          anomaly_score: 0.02,
          created_at: new Date('2026-05-22T00:00:00.000Z'),
        };
      }

      return null;
    });

    mockPrisma.transaction.create.mockImplementation(async ({ data }) => ({
      id: mockTransactionId,
      user_id: data.user_id,
      transaction_type: data.transaction_type,
      category_id: data.category_id,
      user_category_id: data.user_category_id,
      description: data.description,
      amount: data.amount,
      payment_method: data.payment_method,
      transaction_date: new Date(data.transaction_date),
      category_predicted: data.category_predicted,
      confidence_score: data.confidence_score,
      is_anomaly: data.is_anomaly,
      anomaly_score: data.anomaly_score,
      created_at: new Date('2026-05-22T00:00:00.000Z'),
      category: data.category_id ? { id: data.category_id, name: 'makanan' } : null,
      user_category: null,
    }));

    mockPrisma.transaction.update.mockImplementation(async ({ data }) => ({
      id: mockTransactionId,
      user_id: mockAuthUser.id,
      transaction_type: data.transaction_type ?? 'expense',
      category_id: data.category_id ?? mockCategoryId,
      user_category_id: data.user_category_id ?? null,
      description: data.description ?? 'warteg berkah jaya',
      amount: data.amount ?? '15000.00',
      payment_method: data.payment_method ?? 'cash',
      transaction_date: data.transaction_date
        ? new Date(data.transaction_date)
        : new Date('2026-05-22T00:00:00.000Z'),
      category_predicted: 'makanan',
      confidence_score: 0.94,
      is_anomaly: data.is_anomaly ?? false,
      anomaly_score: 0.02,
      created_at: new Date('2026-05-22T00:00:00.000Z'),
      category: { id: data.category_id ?? mockCategoryId, name: 'makanan' },
      user_category: null,
    }));

    mockPrisma.transaction.delete.mockResolvedValue({});

    mockPrisma.transaction.aggregate.mockImplementation(async ({ where }) => {
      if (where?.transaction_type === 'income') {
        return { _sum: { amount: 5000000 } };
      }

      if (where?.transaction_type === 'expense' && where?.category_id === mockCategoryId) {
        return { _sum: { amount: 120000 } };
      }

      return { _sum: { amount: 250000 } };
    });

    mockPrisma.transaction.groupBy.mockResolvedValue([
      { category_id: mockCategoryId, _sum: { amount: 120000 } },
      { category_id: '66666666-6666-4666-8666-666666666666', _sum: { amount: 80000 } },
    ]);

    mockPrisma.transactionFeedback.create.mockResolvedValue({});

    mockPrisma.budget.findMany.mockResolvedValue([
      {
        id: mockBudgetId,
        user_id: mockAuthUser.id,
        category_id: mockCategoryId,
        amount: '250000.00',
        period: '2026-05',
        start_date: new Date('2026-05-01T00:00:00.000Z'),
        end_date: new Date('2026-05-31T23:59:59.999Z'),
        created_at: new Date('2026-05-13T00:00:00.000Z'),
        category: { id: mockCategoryId, name: 'makanan' },
      },
    ]);

    mockPrisma.budget.findUnique.mockImplementation(async ({ where }) => {
      if (where?.id === mockBudgetId) {
        return {
          id: mockBudgetId,
          user_id: mockAuthUser.id,
          category_id: mockCategoryId,
          amount: '250000.00',
          period: '2026-05',
          start_date: new Date('2026-05-01T00:00:00.000Z'),
          end_date: new Date('2026-05-31T23:59:59.999Z'),
          created_at: new Date('2026-05-13T00:00:00.000Z'),
        };
      }

      return null;
    });

    mockPrisma.budget.upsert.mockImplementation(async ({ create }) => ({
      id: mockBudgetId,
      user_id: create.user_id,
      category_id: create.category_id,
      amount: create.amount,
      period: create.period,
      start_date: create.start_date,
      end_date: create.end_date,
      created_at: new Date('2026-05-13T00:00:00.000Z'),
      category: { id: create.category_id, name: 'makanan' },
    }));

    mockPrisma.budget.update.mockImplementation(async ({ data }) => ({
      id: mockBudgetId,
      user_id: mockAuthUser.id,
      category_id: mockCategoryId,
      amount: data.amount,
      period: '2026-05',
      start_date: new Date('2026-05-01T00:00:00.000Z'),
      end_date: new Date('2026-05-31T23:59:59.999Z'),
      created_at: new Date('2026-05-13T00:00:00.000Z'),
      category: { id: mockCategoryId, name: 'makanan' },
    }));

    mockPrisma.budget.delete.mockResolvedValue({});

    mockPrisma.recommendation.findMany.mockResolvedValue([
      {
        id: mockRecommendationId,
        user_id: mockAuthUser.id,
        category_id: mockCategoryId,
        type: 'reduce_spend',
        message: 'Kurangi makan di luar',
        priority: 'high',
        status: 'active',
        created_at: new Date('2026-05-22T00:00:00.000Z'),
        updated_at: new Date('2026-05-22T00:00:00.000Z'),
        category: { id: mockCategoryId, name: 'makanan' },
      },
    ]);

    mockPrisma.recommendation.findUnique.mockImplementation(async ({ where }) => {
      if (where?.id === mockRecommendationId) {
        return {
          id: mockRecommendationId,
          user_id: mockAuthUser.id,
          category_id: mockCategoryId,
          type: 'reduce_spend',
          message: 'Kurangi makan di luar',
          priority: 'high',
          status: 'active',
          created_at: new Date('2026-05-22T00:00:00.000Z'),
          updated_at: new Date('2026-05-22T00:00:00.000Z'),
        };
      }

      return null;
    });

    mockPrisma.recommendation.update.mockImplementation(async ({ data }) => ({
      id: mockRecommendationId,
      user_id: mockAuthUser.id,
      category_id: mockCategoryId,
      type: 'reduce_spend',
      message: 'Kurangi makan di luar',
      priority: 'high',
      status: data.status,
      created_at: new Date('2026-05-22T00:00:00.000Z'),
      updated_at: new Date('2026-05-22T00:00:00.000Z'),
      category: { id: mockCategoryId, name: 'makanan' },
    }));
  });

  it('handles auth flows on the new /api/auth prefix', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Budi Santoso',
      email: 'newuser@example.com',
      password: 'password123',
      phone: '081234567890',
      birthday: '2000-05-13',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.user.email).toBe('newuser@example.com');
    expect(registerResponse.body.data.token).toBe(mockToken);

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'budi@example.com',
      password: 'password123',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBe(mockToken);

    const profileResponse = await request(app).get('/api/auth/profile');

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.user.id).toBe(mockAuthUser.id);

    const updateProfileResponse = await request(app).patch('/api/auth/profile').send({
      name: 'Budi Updated',
      phone: '089876543210',
      birthday: '2000-01-01',
    });

    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.body.data.user.name).toBe('Budi Updated');
  });

  it('returns validation errors for invalid auth payloads', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Budi Santoso',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('covers categories, transactions, budgets, dashboard, and recommendations', async () => {
    const categoriesResponse = await request(app).get('/categories');
    expect(categoriesResponse.status).toBe(200);
    expect(categoriesResponse.body.data.categories).toHaveLength(2);

    const createCategoryResponse = await request(app)
      .post('/categories/custom')
      .send({ name: 'Makan Siang' });
    expect(createCategoryResponse.status).toBe(201);
    expect(createCategoryResponse.body.data.category.name).toBe('Makan Siang');

    const transactionListResponse = await request(app).get('/api/transactions');
    expect(transactionListResponse.status).toBe(200);
    expect(transactionListResponse.body.data.transactions).toHaveLength(1);

    const createTransactionResponse = await request(app).post('/api/transactions').send({
      transaction_type: 'expense',
      amount: 15000,
      payment_method: 'cash',
      transaction_date: '2026-05-22',
      description: 'warteg berkah jaya',
    });

    expect(createTransactionResponse.status).toBe(201);
    expect(createTransactionResponse.body.data.transaction.category_predicted).toBe('makanan');
    expect(mockCheckBudgetThresholds).toHaveBeenCalled();

    const classifyResponse = await request(app).post('/api/transactions/classify').send({
      description: 'warteg berkah jaya',
      amount: 15000,
    });

    expect(classifyResponse.status).toBe(200);
    expect(classifyResponse.body.data.category_predicted).toBe('makanan');

    const overrideResponse = await request(app)
      .put(`/api/transactions/${mockTransactionId}/category`)
      .send({
        corrected_category_id: mockCategoryId,
        feedback_type: 'user_override',
      });

    expect(overrideResponse.status).toBe(200);
    expect(overrideResponse.body.data.transaction.category.id).toBe(mockCategoryId);

    const anomalyFeedbackResponse = await request(app)
      .put(`/api/transactions/${mockTransactionId}/anomaly-feedback`)
      .send({ is_anomaly: false });

    expect(anomalyFeedbackResponse.status).toBe(200);

    const getBudgetsResponse = await request(app).get('/api/budgets?period=2026-05');
    expect(getBudgetsResponse.status).toBe(200);
    expect(getBudgetsResponse.body.data.budgets).toHaveLength(1);

    const createBudgetResponse = await request(app).post('/api/budgets').send({
      category_id: mockCategoryId,
      amount: 250000,
      period: '2026-05',
    });

    expect(createBudgetResponse.status).toBe(201);
    expect(createBudgetResponse.body.data.budget.id).toBe(mockBudgetId);

    const updateBudgetResponse = await request(app)
      .put(`/api/budgets/${mockBudgetId}`)
      .send({ amount: 300000 });

    expect(updateBudgetResponse.status).toBe(200);
    expect(updateBudgetResponse.body.data.budget.amount).toBe(300000);

    const deleteBudgetResponse = await request(app).delete(`/api/budgets/${mockBudgetId}`);
    expect(deleteBudgetResponse.status).toBe(200);

    const dashboardResponse = await request(app).get('/api/dashboard/summary');
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.total_income).toBe(5000000);
    expect(dashboardResponse.body.data.top_categories).toHaveLength(2);

    const recommendationsResponse = await request(app).get('/api/recommendations');
    expect(recommendationsResponse.status).toBe(200);
    expect(recommendationsResponse.body.data.recommendations).toHaveLength(1);

    const updateRecommendationResponse = await request(app)
      .put(`/api/recommendations/${mockRecommendationId}/status`)
      .send({ status: 'done' });

    expect(updateRecommendationResponse.status).toBe(200);
    expect(updateRecommendationResponse.body.data.recommendation.status).toBe('done');
  });

  it('returns validation errors for invalid transaction payloads', async () => {
    const response = await request(app)
      .post('/api/transactions/classify')
      .send({ description: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
});
