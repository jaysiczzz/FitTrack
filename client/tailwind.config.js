/** @type {import('tailwindcss').Config} */

module.exports = {
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#F8FAFC',
          dark: '#0B1120',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#151E2E',
        },
        input: {
          DEFAULT: '#F1F5F9',
          dark: '#1A2333',
        },
        'input-border': {
          DEFAULT: '#E2E8F0',
          dark: '#1F2937',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#10B981',
        },
        'text-primary': {
          DEFAULT: '#0F172A',
          dark: '#F8FAFC',
        },
        'text-muted': {
          DEFAULT: '#64748B',
          dark: '#94A3B8',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#F87171',
        },
        info: {
          DEFAULT: '#0284C7',
          dark: '#38BDF8',
        },
        warning: {
          DEFAULT: '#D97706',
          dark: '#FBBF24',
        },
        tertiary: {
          DEFAULT: '#64748B',
          dark: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
};