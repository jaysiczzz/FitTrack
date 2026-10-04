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
          dark: '#334155',
        },
        accent: {
          DEFAULT: '#047857',
          dark: '#10B981',
          mint: '#34D399',
        },
        'accent-contrast': {
          DEFAULT: '#FFFFFF',
          dark: '#0B1120',
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
          DEFAULT: '#0369A1',
          dark: '#38BDF8',
        },
        warning: {
          DEFAULT: '#B45309',
          dark: '#FBBF24',
        },
        tertiary: {
          DEFAULT: '#64748B',
          dark: '#94A3B8',
        },
        success: {
          DEFAULT: '#047857',
          dark: '#10B981',
        },
      },
      fontFamily: {
        baloo: ['Baloo2_400Regular'],
        'baloo-medium': ['Baloo2_500Medium'],
        'baloo-semibold': ['Baloo2_600SemiBold'],
        'baloo-bold': ['Baloo2_700Bold'],
        sans: ['System', '-apple-system', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};