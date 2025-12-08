import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许局域网访问
    open: true, // 在外部浏览器中自动打开
  },
});

