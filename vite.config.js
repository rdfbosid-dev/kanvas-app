import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dapur MUA',
        short_name: 'Dapur MUA',
        description: 'Kelola booking, tim, dan uang masuk studio makeup-mu di satu tempat.',
        theme_color: '#C4A4F0',
        background_color: '#F6F1FC',
        display: 'standalone',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache aset statis biar app tetap kebuka (walau data booking-nya
        // butuh internet buat update terbaru dari Supabase).
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Tanpa 2 baris ini, versi baru yang di-deploy bakal "nyangkut"
        // nunggu SEMUA instance app ditutup total dulu (jarang kejadian
        // di HP, orang biasa cuma minimize doang) -- jadi update kerasa
        // nggak pernah nyampe walau server-nya udah versi terbaru.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
