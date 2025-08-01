/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
 theme: {
    extend: {
      colors: {
        'brand-bg': '#161616',
        'brand-accent': {
          DEFAULT: '#16a085',
          dark: '#138f75', // for hover states
        },
      },
    },
  },
  plugins: [],
};
