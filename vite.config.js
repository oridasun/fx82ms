import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Permite servir desde una sub-ruta (p.ej. GitHub Pages: /REPO/).
// Se inyecta vía env BASE_URL desde el workflow de despliegue.
const base = process.env.BASE_URL || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png', 'favicon-16.png', 'favicon-32.png'],
      manifest: {
        name: 'ICIENCIA FX-82MS',
        short_name: 'ICIENCIA',
        description: 'Calculadora científica ICIENCIA FX-82MS — réplica funcional de la fx-82MS, instalable y offline.',
        theme_color: '#1f2937',
        background_color: '#1f2937',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
        lang: 'es',
        icons: [
          { src: 'pwa-192x192.png',     sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png',     sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg',            sizes: 'any',     type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: !!process.env.PORT
  }
});
