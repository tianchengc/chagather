import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cha-green-dark": "#31574a",
        "cha-green-light": "#b5d0c3",
        "cha-orange": "#ef592a",
        "cha-cream": "#fcfbf9",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ambient-shift": {
          "0%, 100%": {
            transform: "scale(1) translate3d(0, 0, 0)",
            opacity: "0.9",
          },
          "50%": {
            transform: "scale(1.08) translate3d(0, -2%, 0)",
            opacity: "1",
          },
        },
        "dock-rise": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-8px) scale(1.02)" },
        },
        "orb-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 700ms ease-out both",
        "ambient-shift": "ambient-shift 16s ease-in-out infinite",
        "dock-rise": "dock-rise 800ms ease-out both",
        "orb-drift": "orb-drift 10s ease-in-out infinite",
        "orb-pulse": "orb-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
