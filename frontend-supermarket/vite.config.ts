import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 3D 购物体验端 Vite 配置
 * 后端 Spring Security 关闭了 CORS，因此开发期通过代理转发 /api 与 /ws，前端一律使用相对路径。
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true, changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
  },
} as any)
