import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
        display: ['Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        fire: { DEFAULT: '#f97316', hover: '#ea6c0a' },
        jade: { DEFAULT: '#10b981', hover: '#0da372' },
        brand: {
          teal: '#14b8a6',
          amber: '#f59e0b',
          purple: '#a855f7',
          coral: '#ef4444',
          blue: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
