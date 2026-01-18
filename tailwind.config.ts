import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class', // Disable system preference, require manual 'dark' class
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // Add specific colors if needed, but we are using standard Zinc
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
} satisfies Config
