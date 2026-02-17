/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'whatsapp-green': '#25d366',
        'whatsapp-teal': '#128c7e',
        'whatsapp-dark': '#075e54',
        'whatsapp-light': '#dcf8c6',
        'instagram-pink': '#e4405f',
        'instagram-purple': '#833ab4',
        'instagram-orange': '#fd1d1d',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
