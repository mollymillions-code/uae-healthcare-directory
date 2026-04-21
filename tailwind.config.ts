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
        // Zavis green system — unified brand green (PRESERVED)
        accent: {
          DEFAULT: "#00c853",
          light: "#00e676",
          dark: "#00a844",
          deep: "#006828",
          muted: "#e6f7ed",
        },
        // TechCrunch-style dark/light (PRESERVED)
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

        // NEW — Airbnb-calibrated neutrals (warmed for Zavis cream base)
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#484848",
          muted: "#717171",
          faint: "#b0b0b0",
          line: "#EBEBEB",
          hairline: "#DDDDDD",
        },
        surface: {
          DEFAULT: "#ffffff",
          cream: "#fbf7f2",
          warm: "#f7f3ee",
          inset: "#f0ebe4",
        },
        state: {
          applied: "#1a1a1a",
          dangerSoft: "#FFF1F2",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        arabic: ["var(--font-noto-arabic)", "Noto Sans Arabic", "sans-serif"],
        degular: ["Degular Display Demo", "system-ui", "sans-serif"],
        inter: ["Inter", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // PRESERVED
        hero: ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "700" }],
        "hero-sm": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.015em", fontWeight: "700" }],
        section: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],

        // NEW ladder — denser mid-scale + compact type for UI
        "display-xl": ["64px", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-lg": ["44px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-md": ["32px", { lineHeight: "1.1", letterSpacing: "-0.018em", fontWeight: "600" }],
        "z-h1": ["26px", { lineHeight: "1.18", letterSpacing: "-0.012em", fontWeight: "600" }],
        "z-h2": ["22px", { lineHeight: "1.22", letterSpacing: "-0.008em", fontWeight: "600" }],
        "z-h3": ["18px", { lineHeight: "1.28", fontWeight: "600" }],
        "z-body": ["15px", { lineHeight: "1.5", fontWeight: "400" }],
        "z-body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "z-caption": ["12px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
        "z-micro": ["11px", { lineHeight: "1.3", letterSpacing: "0.04em", fontWeight: "600" }],
      },
      borderRadius: {
        "z-sm": "8px",
        "z-md": "12px",
        "z-lg": "16px",
        "z-pill": "9999px",
        "z-search": "32px",
      },
      transitionTimingFunction: {
        "z-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "z-exit": "cubic-bezier(0.4, 0, 1, 1)",
        "z-overshoot": "cubic-bezier(0.17, 0.67, 0.3, 1.33)",
      },
      transitionDuration: {
        "z-fast": "150ms",
        "z-base": "200ms",
        "z-med": "300ms",
        "z-slow": "450ms",
      },
      aspectRatio: {
        "z-card": "20 / 19",
        "z-mosaic": "2 / 1",
        "z-wide": "16 / 9",
      },
      screens: {
        xs: "480px",
      },
      maxWidth: {
        "z-container": "1280px",
        "z-wide": "1440px",
        "z-full": "1760px",
      },
    },
  },
  plugins: [],
};
export default config;
