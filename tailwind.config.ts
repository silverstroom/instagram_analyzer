import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          50: "#fafaf9",
          100: "#f4f4f2",
          200: "#e7e7e3",
          300: "#d4d4ce",
          400: "#a3a39b",
          500: "#737369",
          600: "#52524a",
          700: "#3d3d37",
          800: "#27272422",
          900: "#1c1c19",
          950: "#0a0a09",
        },
        accent: {
          50: "#fdf5f0",
          100: "#fae8db",
          200: "#f4ceb2",
          300: "#ecac7e",
          400: "#e28549",
          500: "#db6b2a",
          600: "#cc5420",
          700: "#a93f1c",
          800: "#87331d",
          900: "#6e2c1a",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
