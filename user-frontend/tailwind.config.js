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
        /* ── Dark Diwali palette ── */
        surface: {
          DEFAULT: "#0f0d1a",
          2: "#1a1726",
        },
        "dark-bg": "#0a0814",
        "dark-card": "#13111f",
        "dark-card-2": "#1a1726",
        "dark-border": "rgba(255,102,0,0.12)",
        border: "rgba(255,102,0,0.12)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        primary: "0 4px 14px rgba(139, 0, 0, 0.35)",
        "primary-lg": "0 8px 32px rgba(139, 0, 0, 0.25)",
        "glow-sm": "0 0 15px rgba(255,102,0,0.15)",
        "glow-md": "0 0 30px rgba(255,102,0,0.2)",
        "glow-lg": "0 4px 40px rgba(255,102,0,0.3)",
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(140deg, #8b0000, #ff6600, #ffcc33)",
        "fire-gradient-hover":
          "linear-gradient(140deg, #6b0000, #cc5200, #e6b800)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease",
        "bounce-subtle": "bounceSubtle 1s ease infinite",
        "twinkle": "twinkle 2s ease-in-out infinite",
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
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
