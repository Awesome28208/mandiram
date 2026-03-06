/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#52B788',
          600: '#2D6A4F',
          700: '#1b4332',
          800: '#14532d',
          900: '#0a2818',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
