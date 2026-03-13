/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#1B3A6B', light: '#2a4f8f', dark: '#122647' },
        teal:  { DEFAULT: '#0E7F8C', light: '#12a0b0', dark: '#095e68' },
        orange:{ DEFAULT: '#E8523A', light: '#f06a53', dark: '#c43d27' },
        brand: {
          green: '#12B76A',
          amber: '#F79009',
          gray:  '#F2F4F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
