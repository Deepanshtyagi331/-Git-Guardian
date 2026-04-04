/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#1a1a1a',
          800: '#2d2d2d',
          700: '#3d3d3d',
        },
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
