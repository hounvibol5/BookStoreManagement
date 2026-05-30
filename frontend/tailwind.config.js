/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#c8a96e",
        dark: "#0f0e0c",
        surface: "#1a1814",
        card: "#211f1b",
        border: "#2e2b25",
        muted: "#7a7060",
      },
      fontFamily: {
        display: ["Kantumruy Pro", "sans-serif"],
        body: ["Kantumruy Pro", "sans-serif"],
      },
    },
  },
  plugins: [],
};
