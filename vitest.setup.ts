import { vi, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/carepulse_test';

// Mock Prisma Client for unit tests
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(() => ({
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      patient: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      appointment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    })),
  };
});

// Global test hooks
beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

