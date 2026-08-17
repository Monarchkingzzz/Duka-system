/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,25,23,.03), 0 8px 24px rgba(28,25,23,.025)",
        soft: "0 10px 35px rgba(28,25,23,.06)",
      },
    },
  },
  plugins: [],
};
