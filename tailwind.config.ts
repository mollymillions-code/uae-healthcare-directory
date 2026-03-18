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
        // Zavis green system — darker shade as requested
        accent: {
          DEFAULT: "#00a844",   // Darker Zavis green
          light: "#00c853",     // Original Zavis green for highlights
          dark: "#008c38",      // Deep green
          muted: "#e6f7ed",     // Very light green bg
        },
        // TechCrunch-style dark/light
        dark: {
          DEFAULT: "#1a1a1a",
          900: "#0a0a0a",
          800: "#111111",
          700: "#1a1a1a",
          600: "#2a2a2a",
          500: "#3a3a3a",
        },
        light: {
          DEFAULT: "#ffffff",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
        },
        muted: "#717171",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        arabic: ["var(--font-noto-arabic)", "Noto Sans Arabic", "sans-serif"],
      },
      fontSize: {
        "hero": ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "700" }],
        "hero-sm": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.015em", fontWeight: "700" }],
        "section": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
export default config;
