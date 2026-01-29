import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Allow all hosts for Docker
    allowedHosts: true,
    // HMR configuration for proxy and restrictive browser compatibility
    hmr: {
      clientPort: 80,
      host: 'localhost',
      protocol: 'ws',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  },
  // Optimization for better compatibility
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
