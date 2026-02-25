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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        primary: "0 4px 14px rgba(139, 0, 0, 0.35)",
        "primary-lg": "0 8px 32px rgba(139, 0, 0, 0.25)",
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(140deg, #8b0000, #ff6600, #ffcc33)",
        "fire-gradient-hover":
          "linear-gradient(140deg, #6b0000, #cc5200, #e6b800)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease",
        "bounce-subtle": "bounceSubtle 1s ease infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
