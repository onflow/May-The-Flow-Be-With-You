/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./randomness-revolution/**/*.{js,ts,jsx,tsx,mdx}",
    "./actually-fun-games/**/*.{js,ts,jsx,tsx,mdx}",
    "./generative-art-worlds/**/*.{js,ts,jsx,tsx,mdx}",
    "./ai-and-llms/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        memory: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          accent: "#06b6d4",
          dark: "#1e1b4b",
          light: "#f8fafc",
        },
      },
      fontFamily: {
        memory: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
};
