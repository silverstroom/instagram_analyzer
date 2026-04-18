import type { Config } from 'tailwindcss';

/**
 * Tailwind config v5 — palette ink rivista per migliore contrast ratio.
 *
 * Principali cambiamenti rispetto a v4:
 * - ink-500 era #737369 → ora #6b6b61 (migliore contrast su ink-50)
 * - ink-600 era #56564d → ora #4a4a42 (AA pass su ink-50)
 * - ink-700 era #3a3a33 → ora #2f2f29 (AAA pass su ink-50)
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#fafaf9',
          100: '#f0f0ec',
          200: '#e0e0d9',
          300: '#c4c4b9',
          400: '#a3a39b',
          500: '#6b6b61',  // ⬆ più scuro (contrast 4.6:1 su bg ink-50)
          600: '#4a4a42',  // ⬆ più scuro (contrast 7.8:1)
          700: '#2f2f29',  // ⬆ più scuro (contrast 12.3:1)
          800: '#1f1f1b',
          900: '#1c1c19',
        },
        accent: {
          50: '#fff1e6',
          100: '#ffd9b8',
          200: '#ffb478',
          300: '#ff8a3c',
          400: '#db6b2a',
          500: '#cc5420',
          600: '#a84218',
          700: '#7d3012',
          800: '#5c240e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
