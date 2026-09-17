import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对路径：本地开发、GitHub Pages 子路径都能正常加载资源
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
