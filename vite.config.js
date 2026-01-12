import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    strictPort: false,
    // Dev proxies so the frontend can call APIs via same-origin paths.
    // This fixes LAN/mobile access where `localhost` would point to the phone itself.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/search_shops_json': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/shop': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/review_json': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/recommend': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/upload-image': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/articles': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/recommended': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/static': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      // /src/uploads/ 路径代理到 Flask（用于图片文件）
      '/src/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});