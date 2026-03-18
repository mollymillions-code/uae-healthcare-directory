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
        canvas: "#F6F5F2",
        ink: {
          DEFAULT: "#0C1A14",
          light: "rgba(12, 26, 20, 0.15)",
          muted: "#6B726C",
        },
        green: {
          DEFAULT: "#143625",
          light: "#1a4a32",
        },
        gold: {
          DEFAULT: "#B69A52",
          light: "#d4bb7a",
          dark: "#9a7f3e",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        kicker: ["var(--font-oswald)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "hero": ["6vw", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "display-xl": ["4rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-lg": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "display-sm": ["2rem", { lineHeight: "1.15" }],
        "section": ["1.5rem", { lineHeight: "1.2" }],
      },
      spacing: {
        "xs": "0.5rem",
        "sm-space": "1rem",
        "md-space": "2rem",
        "lg-space": "4rem",
        "xl-space": "8rem",
      },
    },
  },
  plugins: [],
};
export default config;
