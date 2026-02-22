import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      rollupOptions: { output: { interop: 'auto' } },
    },
  },
  preload: {},
  renderer: {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: { api: 'modern' },
      },
    },
  },
});
