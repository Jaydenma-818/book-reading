import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // In development the frontend calls /api/... and this forwards it to the
    // Express server started by `npm run server`. In production the rewrite in
    // vercel.json does the same job, so the frontend never needs either URL.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
