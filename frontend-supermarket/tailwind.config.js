/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#22d3ee', red: '#ff0033' },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
