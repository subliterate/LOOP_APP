import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['services/**/*.test.ts', 'services/**/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['services/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
