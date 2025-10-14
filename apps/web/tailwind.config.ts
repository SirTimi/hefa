import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        primary: '#2C6E49',
        secondary: '#FFB703',
        accent: '#008F5D',
        background: '#0B0B0B',
        foreground: '#FFFFFF',
        muted: '#E6E6E6',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          xl: '1200px',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config
