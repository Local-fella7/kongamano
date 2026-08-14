// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },
  runtimeConfig: {
    // Server-side proxy target used by server/api/[...].ts in dev/preview.
    // For `nuxt preview`, set the env var BEFORE running: $env:NUXT_API_BASE="https://..."; pnpm preview
    // For `nuxt build`, set it BEFORE building so it is baked into the output.
    apiBase: process.env.NUXT_API_BASE || 'http://localhost/kongamano',
    public: {
      // Browser-side API base. In dev/preview the browser calls /api/... and the
      // Nitro proxy (server/api/[...].ts) forwards to `apiBase`. In the static
      // cPanel build there is no Node server, so the browser must call the
      // CodeIgniter backend directly on the same origin: /backend/api.
      // Set NUXT_PUBLIC_API_BASE=/backend/api in the production build.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  modules: ['@pinia/nuxt', 'notivue/nuxt', '@nuxtjs/google-fonts'],
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    'notivue/notification.css',
    'notivue/animations.css',
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: 'Kongamano - Management System',
      link: [
        { rel: 'icon', type: 'image/png', href: '/mana%20ministries.png' },
        { rel: 'apple-touch-icon', href: '/mana%20ministries.png' }
      ]
    }
  },
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      'Plus Jakarta Sans': [600, 700, 800],
    },
    download: true,
    inject: true,
  },
  notivue: {
    position: 'top-center',
    limit: 4,
  }
})