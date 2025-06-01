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
      screens: {
        xs: "475px",
        touch: { raw: "(hover: none) and (pointer: coarse)" },
      },
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
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      minHeight: {
        touch: "44px",
        "screen-safe":
          "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      },
      minWidth: {
        touch: "44px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounceGentle 0.6s ease-in-out",
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
        bounceGentle: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
    },
  },
};
