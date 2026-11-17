/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        border: "var(--color-border)",
        ring: "var(--color-ring)",
        kora: {
          lilac: "#C8C3F2",
          lilacHover: "#DDD9FB",
          mint: "#A8E6CF",
          emerald: "#00FF66",
          cyan: "#00F0FF",
          amber: "#FFA500",
          crimson: "#FF2A54",
          obsidian: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "Syne", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Georgia", "Playfair Display", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
