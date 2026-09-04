import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Публикация через превью-прокси Arena (e2b.app): разрешаем любой host, чтобы dev-сервер
    // принимал запросы к {port}-{sandboxId}.e2b.app и не возвращал 403.
    allowedHosts: true,
    fs: { allow: ['..'] }
  },
  build: { target: 'es2020' }
});
