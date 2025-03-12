/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#0078D4', // CodeGuide blue
          600: '#0078D4',
          700: '#0062AD',
          800: '#004D8C',
          900: '#003A6B',
        },
        gray: {
          100: '#F5F6F7', // Light gray background
          800: '#1F2937', // Dark mode background
          900: '#111827', // Darker background
        }
      },
      animation: {
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
  },
  plugins: [],
} 