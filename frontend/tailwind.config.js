/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#faf8fc',
          100: '#f3eef8',
          200: '#e6ddf1',
          300: '#d9c9e8',
          400: '#c29dc0',
          500: '#d985dd',
          600: '#b876b8',
          700: '#9a5a9a',
          800: '#7a407a',
          900: '#5a2d5a',
        },
        surface: {
          DEFAULT: '#ffffff',
          1: '#faf8fc',
          2: '#f3eef8',
          3: '#ede4f0',
          4: '#e4d9ea',
        },
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.35s ease-out',
        'fade-in':  'fadeIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
}