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
          blue: '#00f3ff',     // Electric Cyan
          purple: '#bd00ff',   // Neon Purple
          pink: '#ff0099',     // Cyber Pink
          green: '#00ff9f',    // Neon Green
          yellow: '#ffea00',   // Cyber Yellow
          slate: '#1e293b',    // Slate for panels
        },
        dark: {
          950: '#020617',      // Deep Void (Darker than 900)
          900: '#0a0a0f',      // Original Dark
          800: '#131318',      // Panel BG
          700: '#1a1a24',
          600: '#252530',
          500: '#30303c',
        },
        light: {
          50: '#F8FAFC',   // Slate-50: Main background (Soft off-white)
          100: '#F1F5F9',  // Slate-100: Secondary background / Panels
          150: '#E2E8F0',  // Slate-200: Hover states / Accents
          200: '#CBD5E1',  // Slate-300: Borders (Subtle)
          250: '#94A3B8',  // Slate-400: Borders (Strong) / Icons
          300: '#64748B',  // Slate-500: Muted text
          350: '#475569',  // Slate-600: Body text
          400: '#334155',  // Slate-700: Headings / Strong text
          500: '#1E293B',  // Slate-800: Primary text / Dark backgrounds
          600: '#0F172A',  // Slate-900: Deepest text / Black replacement
          700: '#020617',  // Slate-950: Absolute darkest
          800: '#1e293b',  // Legacy mapping
          900: '#0f172a',  // Legacy mapping
        },
        status: {
          critical: {
            light: '#D32F2F',
            dark: '#FF4444',
          },
          warning: {
            light: '#E65100',
            dark: '#f59e0b',   // Amber for Cyber-Diagnostic warning
          },
          success: {
            light: '#43A047',
            dark: '#00ff9f',   // Neon Green for success
          },
          info: {
            light: '#1976D2',
            dark: '#00f3ff',   // Cyan for info
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
