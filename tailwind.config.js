/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#0B0F1A",
        surface: "#141B2E",
        surface2: "#1C2440",
        line: "#2A3352",
        ink: "#EDEAF6",
        muted: "#8B93B0",
        coral: "#FF6B5B",
        periwinkle: "#6C8CFF",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        driftGlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.08)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite",
        driftGlow: "driftGlow 14s ease-in-out infinite",
        fadeUp: "fadeUp 0.35s cubic-bezier(0.2,0.6,0.4,1) both",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 12px 32px -16px rgba(0,0,0,0.55)",
        cardHover: "0 1px 2px rgba(0,0,0,0.35), 0 20px 48px -18px rgba(255,107,91,0.18)",
        glow: "0 0 120px 40px rgba(255,107,91,0.12)",
      },
    },
  },
  plugins: [],
};
