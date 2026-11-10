/** @type {import('tailwindcss').Config} */
// Tailwind 配置：关闭 preflight，避免与 Element Plus 基础样式冲突
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {}
  },
  plugins: []
}
