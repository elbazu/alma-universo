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
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#8aadff',
          400: '#5585ff',
          500: '#2d5eff',
          600: '#1a3fff',
          700: '#1230e0',
          800: '#1328b4',
          900: '#16268d',
          950: '#0e1654',
        },
        gold: {
          400: '#f0c040',
          500: '#e5a800',
        }
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        cinzel:  ['Cinzel', 'serif'],
        sans:    ['Jost', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
