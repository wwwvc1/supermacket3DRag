/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * 商户后台 Vite 配置
 * - 端口 5174（3D 超市前端占用 5173）
 * - 后端关闭了 CORS，因此所有请求均走相对路径，由开发代理转发到 8080
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,
    proxy: {
      // REST 接口代理
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // 原生 WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts']
  }
})
