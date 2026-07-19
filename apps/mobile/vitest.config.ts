import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['lib/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@graphology/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@graphology/utils': path.resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@graphology/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
    },
  },
});
