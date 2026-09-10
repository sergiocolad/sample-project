/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f6fb",
          100: "#e6ebf7",
          500: "#3956a5",
          600: "#2d4485",
          700: "#233467",
        },
      },
    },
  },
  plugins: [],
};
