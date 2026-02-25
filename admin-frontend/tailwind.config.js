/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff6600",
          dark: "#8b0000",
          light: "#ffcc33",
        },
        accent: {
          DEFAULT: "#ff6600",
          light: "#ffcc33",
        },
        surface: {
          DEFAULT: "#FFF8F5",
          2: "#FFF0E8",
        },
        border: "#FFD4B8",
        sidebar: "#1A0A00",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        primary: "0 4px 14px rgba(139, 0, 0, 0.35)",
        "primary-lg": "0 8px 32px rgba(139, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
