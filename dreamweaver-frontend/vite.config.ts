import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/dreamweaver/',
  server: {
    port: 5173,
    // 与 base 一致，避免打开根路径看不到页面或样式像「没更新」
    open: '/dreamweaver/',
    proxy: {
      // 与 src/services/api.ts 中 API_BASE=/dreamweaver-api/api 一致，转发到本机后端
      '/dreamweaver-api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        rewrite: (path) => {
          // 后端 auth 路由为 /auth/*，前端为 /dreamweaver-api/api/auth/*
          if (path.startsWith('/dreamweaver-api/api/auth')) {
            return path.replace(/^\/dreamweaver-api\/api\/auth/, '/auth')
          }
          // /dreamweaver-api/api/projects、/dreamweaver-api/api/generate -> /api/...
          return path.replace(/^\/dreamweaver-api/, '')
        },
      },
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  }
})
