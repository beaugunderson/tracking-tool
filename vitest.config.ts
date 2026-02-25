import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/renderer/src/**/*.test.{ts,tsx}', 'src/main/**/*.test.ts'],
    setupFiles: './src/renderer/src/setupTests.ts',
    environmentMatchGlobs: [
      // Main process tests run in Node (no jsdom, no renderer setup)
      ['src/main/**/*.test.ts', 'node'],
    ],
  },
});
