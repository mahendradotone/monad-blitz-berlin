/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        monad: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        slate: {
          950: '#0a0a14',
          900: '#0f0f1e',
          850: '#15152b',
          800: '#1c1c38',
          700: '#252548',
        },
        flame: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        lightning: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        neon: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          pink: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out',
        'cell-pulse': 'cell-pulse 0.6s ease-out',
        'ticker-in': 'ticker-in 0.4s ease-out',
        'count-up': 'count-up 0.5s ease-out',
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'gradient-shift': 'gradient-shift 6s ease infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168, 85, 247, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(168, 85, 247, 0.6)' },
        },
        'cell-pulse': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(168, 85, 247, 0.8)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 16px 4px rgba(168, 85, 247, 0.7)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(168, 85, 247, 0)' },
        },
        'ticker-in': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
