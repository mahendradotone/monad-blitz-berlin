/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#eef2f7',
          200: '#dfe7ef',
          300: '#c7d2e0',
          400: '#9aa9bf',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1f2937',
          900: '#111827',
        },
        accent: {
          50: '#f0f7ff',
          100: '#dfeeff',
          200: '#bfdcff',
          300: '#8fc0ff',
          400: '#5ba3ff',
          500: '#2d7ef7',
          600: '#1f62d8',
          700: '#1d4fb6',
        },
        success: {
          50: '#f0fdf8',
          100: '#dffcf2',
          200: '#baf4df',
          300: '#87ebcc',
          400: '#4ad8a6',
          500: '#18b47d',
        },
        warning: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 14px 30px rgba(15, 23, 42, 0.08)',
        card: '0 10px 24px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out',
        'cell-pulse': 'cell-pulse 0.6s ease-out',
        'ticker-in': 'ticker-in 0.4s ease-out',
        'count-up': 'count-up 0.5s ease-out',
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
          '50%': { boxShadow: '0 0 18px 4px rgba(59, 130, 246, 0.18)' },
        },
        'cell-pulse': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.2)' },
          '50%': { transform: 'scale(1.06)', boxShadow: '0 0 16px 4px rgba(59, 130, 246, 0.14)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
        },
        'ticker-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
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
      },
    },
  },
  plugins: [],
};
