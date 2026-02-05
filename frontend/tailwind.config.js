/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Colors
                navy: {
                    DEFAULT: '#0F172A',
                    light: '#1E293B',
                },
                slate: {
                    DEFAULT: '#1F2937',
                    light: '#374151',
                },
                // Accent Colors
                cyan: {
                    DEFAULT: '#38BDF8',
                    dark: '#06B6D4',
                },
                emerald: {
                    DEFAULT: '#10B981',
                },
                // Background Colors
                bg: {
                    primary: '#F8FAFC',
                    secondary: '#F1F5F9',
                },
                // Text Colors
                text: {
                    primary: '#0F172A',
                    secondary: '#475569',
                    muted: '#94A3B8',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Poppins', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'card': '12px',
            },
            boxShadow: {
                'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
                'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
        },
    },
    plugins: [],
}
