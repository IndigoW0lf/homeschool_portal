import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // API/server tests run in node; component tests (.tsx) run in jsdom
    environmentMatchGlobs: [
      ['src/**/*.test.tsx', 'jsdom'],
      ['src/**/*.spec.tsx', 'jsdom'],
    ],
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.test.tsx', 'src/**/*.spec.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
});
