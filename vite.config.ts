import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  server: { port: 5180 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Psalter',
        short_name: 'Psalter',
        description: 'Sing the 1650 Scottish Psalter.',
        theme_color: '#7a2e2e',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '.',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // Precache the app, the index and the tunes. Each psalm is cached when
        // it is first opened, so the install stays small.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'corpus/index.json', 'corpus/tunes/*.json'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/corpus/psalms/') || url.pathname.includes('/corpus/settings/'),
            handler: 'CacheFirst',
            options: { cacheName: 'psalms', expiration: { maxEntries: 400 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://api.fontshare.com' || url.origin === 'https://cdn.fontshare.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
})
