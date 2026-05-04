/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Terracotta — primary brand */
        brand: {
          50:  '#fbf1ef',
          100: '#f5dcd6',
          200: '#edb8ab',
          300: '#e08e7b',
          400: '#d16750',
          500: '#b3322b',
          600: '#9a2923',
          700: '#7e211d',
          800: '#621a17',
          900: '#4a1312',
          950: '#2e0a0a',
        },
        /* Gold — accent */
        gold: {
          50:  '#fdf9f0',
          100: '#faefd4',
          200: '#f3dca1',
          300: '#ebc469',
          400: '#d4a574',
          500: '#c28a49',
          600: '#a36f35',
          700: '#82562b',
          800: '#634124',
          900: '#4a311d',
        },
        /* Cream — surface */
        cream: {
          50:  '#fdfcf9',
          100: '#faf8f5',
          200: '#f3efe7',
          300: '#e8e1d2',
          400: '#d7cbb3',
        },
        /* Semantic surfaces — driven by CSS variables so dark mode just works */
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          secondary: 'rgb(var(--surface-secondary) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        },
        body: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
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
