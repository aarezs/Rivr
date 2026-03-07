import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/backboard': {
        target: 'https://app.backboard.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backboard/, '/api'),
      },
    },
  },
})
