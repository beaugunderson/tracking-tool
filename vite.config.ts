import electron from 'vite-electron-plugin';
import react from '@vitejs/plugin-react';
import renderer from 'vite-plugin-electron-renderer';
import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';

export default defineConfig(() => {
  rmSync('dist-electron', { recursive: true, force: true });

  return {
    plugins: [
      react(),

      electron({
        include: ['electron'],
        transformOptions: {
          sourcemap: true,
        },
      }),

      renderer({}),
    ],

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },

    clearScreen: false,
  };
});
