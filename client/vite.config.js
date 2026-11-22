import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (!id.includes('node_modules')) return;
    if (/\/(react|react-dom|scheduler|react-router-dom|react-redux|@reduxjs\/toolkit)\//.test(id)) return 'vendor-react';
    if (/\/(recharts|d3-[^/]+)\//.test(id)) return 'vendor-charts';
    if (/\/framer-motion\//.test(id)) return 'vendor-motion';
    if (/\/lucide-react\//.test(id)) return 'vendor-icons';
    if (/\/axios\//.test(id)) return 'vendor-network';
  } } } }
});
