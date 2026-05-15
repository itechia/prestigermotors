import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Libs pesadas usadas apenas no admin — não carregam para usuários comuns
          if (id.includes('recharts'))    return 'chunk-recharts';
          if (id.includes('react-quill') || id.includes('/quill/')) return 'chunk-quill';
          if (id.includes('/three/') || id.includes('three-stdlib')) return 'chunk-three';
          // Vendor React base
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'chunk-react';
          // React Router e Query separados para cache de longa duração
          if (id.includes('react-router') || id.includes('@tanstack/react-query')) return 'chunk-routing';
        },
      },
    },
  },
})
