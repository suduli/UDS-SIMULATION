/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
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
        },
        light: {
          50: '#E3EDF7',   // Light blue background - main body
          100: '#F7FAFB',  // Very light gray/blue for panels
          150: '#F0F4F8',  // Soft blue-gray for secondary surfaces
          200: '#ECECEC',  // Secondary panel background
          250: '#E6EEF5',  // Alternative panel shade
          300: '#D0D7DE',  // Borders and dividers - enhanced contrast
          350: '#C0C7CE',  // Intermediate shade for stronger borders
          400: '#A0A7AE',  // Additional mid-tone
          500: '#64748b',  // Medium text
          600: '#475569',  // Secondary text
          700: '#334155',  // Headings
          800: '#1e293b',  // Strong emphasis
          900: '#1A334D',  // Primary text for light mode
        },
        status: {
          critical: {
            light: '#D32F2F',
            dark: '#FF4444',
          },
          warning: {
            light: '#E65100',  // Enhanced visibility from #F57C00
            dark: '#FFEB3B',
          },
          success: {
            light: '#43A047',
            dark: '#00C853',
          },
          info: {
            light: '#1976D2',
            dark: '#42A5F5',   // Enhanced from #2196F3
          }
        },
        primary: {
          light: '#1976D2',
          dark: '#2196F3',
        },
        disabled: {
          light: '#4b5563',    // Improved contrast from #6b7280
          dark: '#6b7280',
        },
        secondary: {
          light: '#475569',    // Enhanced from #64748b
          dark: '#9ca3af',
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
        'packet-request': 'packet-request 2500ms ease-in-out forwards',
        'packet-response': 'packet-response 2500ms ease-in-out forwards',
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
          '15%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
          '85%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
          '100%': { left: '100%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' }
        },
        'packet-response': {
          '0%': { right: '0%', opacity: '0', transform: 'translateY(-50%) scale(0.8)' },
          '15%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
          '85%': { opacity: '1', transform: 'translateY(-50%) scale(1)' },
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
