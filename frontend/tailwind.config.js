/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
    "./stores/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#131313",
        ink: "#f3ede8",
        panel: "#1b1919",
        accent: "#e02424",
        accentDark: "#0e0e0e",
        muted: "#a39a93",
        border: "#353534"
      },
      boxShadow: {
        card: "0 24px 48px rgba(224, 36, 36, 0.06)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
