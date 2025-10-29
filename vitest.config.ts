import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'services/**/*.test.ts',
      'services/**/__tests__/**/*.test.ts',
      '__tests__/**/*.test.ts',
    ],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['services/**/*.ts', 'cli.ts'],
    },
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 15000, // 15 seconds for setup/teardown
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
