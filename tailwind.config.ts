import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          DEFAULT: "#fafaf7",
          50: "#fafaf7",
          100: "#f3f2ed",
          200: "#e8e6df",
          300: "#d4d1c7",
          400: "#b5b0a3",
        },
        ink: {
          DEFAULT: "#141414",
          50: "#f5f5f5",
          100: "#e0e0e0",
          200: "#b0b0b0",
          300: "#808080",
          400: "#505050",
          500: "#333333",
          600: "#222222",
          700: "#141414",
        },
        warm: {
          DEFAULT: "#c8553a",
          50: "#fdf5f3",
          100: "#fbe8e3",
          200: "#f5cdc3",
          300: "#edab9a",
          400: "#df7e67",
          500: "#c8553a",
          600: "#b5432b",
          700: "#963622",
        },
      },
      fontFamily: {
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "display": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};
export default config;
