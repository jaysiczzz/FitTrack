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
          DEFAULT: '#F7F8FA',
          dark: '#0B0F1A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#111726',
        },
        input: {
          DEFAULT: '#EEF1F5',
          dark: '#1B2333',
        },
        'input-border': {
          DEFAULT: '#DDE2EA',
          dark: '#2A3346',
        },
        accent: {
          DEFAULT: '#00B386',
          dark: '#00E5A0',
        },
        'text-primary': {
          DEFAULT: '#0B0F1A',
          dark: '#FFFFFF',
        },
        'text-muted': {
          DEFAULT: '#5C6478',
          dark: '#8A93A6',
        },
      },
    },
  },
  plugins: [],
};