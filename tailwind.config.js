/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          darkest: '#070c18',
          dark: '#0b1325',
          card: '#0f1c34',
          panel: '#162646',
          border: '#1f355e',
          hover: '#1a2e54',
        },
        brand: {
          blue: '#1d6bf3',
          blueDark: '#1557c0',
          blueLight: '#e8f0fe',
          navy: '#0f172a',
          emerald: '#10b981',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'blue-glow': '0 4px 15px rgba(29, 107, 243, 0.3)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.4)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.45)',
      }
    },
  },
  plugins: [],
}
