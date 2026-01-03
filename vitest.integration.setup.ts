import { beforeAll, afterAll } from 'vitest';

/**
 * Integration test setup
 * 
 * IMPORTANT: Integration tests use a REAL test database
 * Make sure DATABASE_URL points to carepulse_test, not production!
 */

// Ensure we're using test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/carepulse_test';

beforeAll(async () => {
  console.log('🧪 Starting integration tests...');
  console.log(`📊 Using database: ${process.env.DATABASE_URL}`);
  
  // Note: In a real setup, you might want to:
  // 1. Run migrations on test database
  // 2. Seed test data
  // This is typically done via a setup script before tests run
});

afterAll(async () => {
  console.log('✅ Integration tests complete');
  
  // Cleanup test data if needed
  // Be careful not to delete production data!
});

