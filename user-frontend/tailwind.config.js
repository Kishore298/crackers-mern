/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF4500",
          dark: "#CC3700",
          light: "#FF6B35",
        },
        accent: {
          DEFAULT: "#FF6B00",
          light: "#FFB347",
        },
        surface: {
          DEFAULT: "#FFF8F5",
          2: "#FFF0E8",
        },
        border: "#FFD4B8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        primary: "0 4px 14px rgba(255, 69, 0, 0.35)",
        "primary-lg": "0 8px 32px rgba(255, 69, 0, 0.25)",
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(135deg, #FF4500, #FF6B00)",
        "fire-gradient-hover": "linear-gradient(135deg, #CC3700, #FF4500)",
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
