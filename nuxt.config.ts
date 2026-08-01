// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE || 'http://localhost/kongamano'
  },
  modules: [
    '@pinia/nuxt',
    'notivue/nuxt'
  ],
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    'notivue/notification.css',
    'notivue/animations.css',
    '~/assets/css/main.css'
  ],
  notivue: {
    position: 'top-right',
    limit: 4,
  }
})
