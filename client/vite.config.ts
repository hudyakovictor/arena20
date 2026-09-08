import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Workspace source alias: без prebuild shared (монорепо-scaffold, T000).
      '@signal-arena/shared': resolve(rootDir, '../shared/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Dev-preview за прокси (песочница/CI): разрешаем любой host.
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    // Phaser runtime — отдельный бюджет вне first-pack 250KB (ui-graphics.md §11).
    chunkSizeWarningLimit: 2600,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // T017 минимум: offline shell + manifest. Precache — только лёгкий shell;
      // игровой бандл (Phaser runtime) — через runtime-кэш, отдельным бюджетом.
      workbox: {
        globPatterns: ['**/*.{css,html,svg,wav,png,woff2}', 'assets/icons/*.svg'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'game-runtime', expiration: { maxEntries: 20 } },
          },
        ],
      },
      manifest: {
        name: 'SIGNAL ARENA — тренажёр решений',
        short_name: 'SIGNAL ARENA',
        description: 'Игровой тренажёр качества торговых решений на исторических ситуациях.',
        lang: 'ru',
        theme_color: '#0B0C0D',
        background_color: '#0B0C0D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['games', 'education', 'finance'],
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
