/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            animation: {
                'spin-slow': 'spin 3s cubic-bezier(0.4, 0, 0.2, 1)',
                'gradient': 'gradient 3s linear infinite',
                'glow': 'glow 1s ease-in-out infinite alternate',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
                glow: {
                    '0%': {
                        'text-shadow': '0 0 10px #4f46e5, 0 0 20px #4f46e5, 0 0 30px #4f46e5',
                    },
                    '100%': {
                        'text-shadow': '0 0 20px #4f46e5, 0 0 30px #4f46e5, 0 0 40px #4f46e5',
                    },
                },
            },
        },
    },
    plugins: [],
} 