import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Integration test configuration
 * Uses actual database connections (test database)
 * Runs slower than unit tests but tests real integrations
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./vitest.integration.setup.ts'],
    // Longer timeout for integration tests
    testTimeout: 30000,
    // Run integration tests sequentially
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

