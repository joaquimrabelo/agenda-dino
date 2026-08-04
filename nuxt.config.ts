// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Agenda Dino',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#BFE3FF' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Agenda Dino',
      short_name: 'Agenda Dino',
      description: 'Painel de lembretes visuais e sonoros de rotina',
      theme_color: '#BFE3FF',
      background_color: '#BFE3FF',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      icons: [
        { src: 'icons/dino-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
        { src: 'icons/dino-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        { src: 'icons/dino-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable' },
        { src: 'icons/dino-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,mp3,wav,woff2}'],
      navigateFallback: '/'
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
