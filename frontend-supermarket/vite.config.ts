import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * KORA × TACTILE ARCHIVE 3D 触感物理陈列旗舰店 Vite 配置
 * 开发期通过代理转发 /api 与 /ws 至后端 Spring Boot (localhost:8080)
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/ws": { target: "ws://localhost:8080", ws: true, changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
} as any);
