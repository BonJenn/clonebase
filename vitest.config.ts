import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Env must be set before any src module loads, since some modules (e.g.
    // constants.ts) read env vars at import time.
    env: {
      NEXT_PUBLIC_ROOT_DOMAIN: 'clonebase.app',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
