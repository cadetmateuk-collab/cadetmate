import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/component/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', '.next', 'apps', 'e2e'],
    css: false,
    restoreMocks: true,
  },
  resolve: {
    alias: [
      {
        find: '@cadet-mate/shared/config',
        replacement: path.resolve(root, './packages/shared/src/config.ts'),
      },
      {
        find: '@cadet-mate/shared',
        replacement: path.resolve(root, './packages/shared/src/index.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(root, './'),
      },
    ],
  },
});
