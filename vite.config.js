import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Change to your preferred port
    host: true  // Expose to network
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          // Split chart library separately
          charts: ['recharts'],
          // Split icons and utilities
          ui: ['lucide-react', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Reduce warning threshold
  }
})
