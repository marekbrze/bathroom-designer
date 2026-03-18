import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bathroom-designer/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
