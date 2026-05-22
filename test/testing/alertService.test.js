import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockPrisma = {
  budget: {
    findUnique: jest.fn(),
  },
  transaction: {
    aggregate: jest.fn(),
  },
  alert: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('checkBudgetThresholds', () => {
  const mockBudget = {
    id: '44444444-4444-4444-8444-444444444444',
    amount: '100000.00',
    start_date: new Date('2026-05-01T00:00:00.000Z'),
    end_date: new Date('2026-05-31T23:59:59.999Z'),
    category: { name: 'makanan' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.doMock('../../src/config/database.js', () => ({
      __esModule: true,
      default: mockPrisma,
    }));
  });

  it('creates warning, alert, and over alerts at 100 percent', async () => {
    const { checkBudgetThresholds } = await import('../../src/utils/alertService.js');

    mockPrisma.budget.findUnique.mockResolvedValue(mockBudget);
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 100000 } });
    mockPrisma.alert.findFirst.mockResolvedValue(null);
    mockPrisma.alert.create.mockResolvedValue({});

    await checkBudgetThresholds(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '2026-05-22'
    );

    expect(mockPrisma.alert.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ level: 'warning' }),
      })
    );
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ level: 'alert' }),
      })
    );
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ level: 'over' }),
      })
    );
  });

  it('creates only warning and alert at 90 percent', async () => {
    const { checkBudgetThresholds } = await import('../../src/utils/alertService.js');

    mockPrisma.budget.findUnique.mockResolvedValue(mockBudget);
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 90000 } });
    mockPrisma.alert.findFirst.mockResolvedValue(null);
    mockPrisma.alert.create.mockResolvedValue({});

    await checkBudgetThresholds(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '2026-05-22'
    );

    expect(mockPrisma.alert.create).toHaveBeenCalledTimes(2);
  });

  it('does not create alerts below 70 percent', async () => {
    const { checkBudgetThresholds } = await import('../../src/utils/alertService.js');

    mockPrisma.budget.findUnique.mockResolvedValue(mockBudget);
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });

    await checkBudgetThresholds(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '2026-05-22'
    );

    expect(mockPrisma.alert.create).not.toHaveBeenCalled();
  });

  it('skips alert creation when no budget exists', async () => {
    const { checkBudgetThresholds } = await import('../../src/utils/alertService.js');

    mockPrisma.budget.findUnique.mockResolvedValue(null);

    await checkBudgetThresholds(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '2026-05-22'
    );

    expect(mockPrisma.transaction.aggregate).not.toHaveBeenCalled();
    expect(mockPrisma.alert.create).not.toHaveBeenCalled();
  });
});
