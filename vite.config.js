import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to the backend during local development so that
      // relative "/api" requests behave the same as they do in production
      // (where Netlify proxies them — see netlify.toml).
      '/api': {
        target: 'https://bladdersense-582048c5cf7e.herokuapp.com',
        changeOrigin: true,
        secure: true,
      },
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
