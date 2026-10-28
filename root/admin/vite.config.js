import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
<<<<<<< HEAD
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5174,
    strictPort: true,
=======
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
>>>>>>> 61924c3bf27ac1f8dd1d0fe45d66ff45031f43e2
  },
})
