/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'egg-purple': '#9c6dff',
        'egg-pink': '#ff6db5',
        'egg-teal': '#6dffee',
        'egg-light': '#f5f0ff',
        'egg-dark': '#2a1a40',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 