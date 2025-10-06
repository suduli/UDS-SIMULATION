/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00f3ff',
          purple: '#bf00ff',
          pink: '#ff006e',
          green: '#00ff9f',
          yellow: '#ffea00',
        },
        dark: {
          900: '#0a0a0f',
          800: '#131318',
          700: '#1a1a24',
          600: '#252530',
          500: '#30303c',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'packet-request': 'packet-request 800ms ease-out forwards',
        'packet-response': 'packet-response 800ms ease-out forwards',
      },
      keyframes: {
        glow: {
          'from': { textShadow: '0 0 5px #00f3ff, 0 0 10px #00f3ff, 0 0 15px #00f3ff' },
          'to': { textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff' }
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' }
        },
        slideUp: {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          'from': { transform: 'translateY(-10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        shimmer: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' }
        },
        gradientShift: {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'right center' }
        },
        'packet-request': {
          '0%': { left: '0%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
          '100%': { left: '100%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' }
        },
        'packet-response': {
          '0%': { right: '0%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
          '100%': { right: '100%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.cyber.blue"), 0 0 20px theme("colors.cyber.blue")',
        'neon-pink': '0 0 5px theme("colors.cyber.pink"), 0 0 20px theme("colors.cyber.pink")',
        'neon-purple': '0 0 5px theme("colors.cyber.purple"), 0 0 20px theme("colors.cyber.purple")',
        'neon-green': '0 0 5px theme("colors.cyber.green"), 0 0 20px theme("colors.cyber.green")',
      }
    },
  },
  plugins: [],
}
