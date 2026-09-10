/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#EEF1F0',
        panel: '#FFFFFF',
        ink: '#1C2321',
        'ink-soft': '#5B655F',
        line: '#D7DDD8',
        blue: '#2C5F8A',    // factory / info
        ochre: '#C1622B',   // in-transit / warning
        green: '#3E7A57',   // in-stock / success
        red: '#B23A48',     // sold / alert
        violet: '#6C5A8C',  // verified
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
};
