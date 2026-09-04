import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Публикация через превью-прокси Arena (e2b.app): разрешаем любой host, чтобы dev-сервер
    // принимал запросы к {port}-{sandboxId}.e2b.app и не возвращал 403.
    allowedHosts: true,
    fs: { allow: ['..'] },
    // Мост клиент↔API: браузер ходит относительными URL, dev-сервер проксирует к бэкенду
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    }
  },
  build: { target: 'es2020' }
});
