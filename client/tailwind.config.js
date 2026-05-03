/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#0d0f12',
          surface: '#13161b',
          elevated: '#1a1e25',
          border: '#252a33',
          hover: '#1e2430',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00e5a0',
          amber: '#ffb547',
          red: '#ff4d6a',
          purple: '#b47dff',
        },
        level: {
          info: '#00d4ff',
          warn: '#ffb547',
          error: '#ff4d6a',
          debug: '#7a8494',
          fatal: '#ff0055',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.15s ease-out',
        blink: 'blink 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(-4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
      },
    },
  },
  plugins: [],
}
