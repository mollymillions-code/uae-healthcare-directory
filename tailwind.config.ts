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
        // Editorial luxury palette — UAE-inspired
        cream: {
          DEFAULT: "#f5f0e8",
          50: "#faf8f4",
          100: "#f5f0e8",
          200: "#ede5d6",
          300: "#ddd0b8",
        },
        teal: {
          DEFAULT: "#0d7377",
          50: "#ecfcfc",
          100: "#c7f5f5",
          200: "#8fe8e8",
          300: "#4dd4d4",
          400: "#1aabab",
          500: "#0d7377",
          600: "#0a5c5f",
          700: "#084a4d",
          800: "#063a3c",
          900: "#042b2d",
        },
        sand: {
          DEFAULT: "#d4a574",
          50: "#fdf6ef",
          100: "#f9e8d4",
          200: "#f0cda3",
          300: "#e4ac6e",
          400: "#d4a574",
          500: "#c48a4e",
          600: "#a86d38",
          700: "#8c5530",
          800: "#73452b",
          900: "#5f3926",
        },
        dark: "#1a1a1a",
        charcoal: "#2d2d2d",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "slide-in": "slideIn 0.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
