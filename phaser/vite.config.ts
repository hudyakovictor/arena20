import { defineConfig } from 'vite';
export default defineConfig({
  // base '/' для dev, './' для prod — но dev с './' ломает абсолютные /src/main.ts в некоторых прокси
  // поэтому ставим '/' и позволяем preview работать через allowedHosts
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    fs: { allow: ['..'] }
  },
  build: { target: 'es2020' },
  // чтобы SVG грузились как есть, без оптимизации
  assetsInclude: ['**/*.svg']
});
