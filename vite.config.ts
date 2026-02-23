import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['logo.webp', 'pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '糊个铲铲',
        short_name: '糊个铲铲',
        description: '纯前端离线训练站',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2f6a4e',
        background_color: '#f5f8f2',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html'
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**']
  }
});
