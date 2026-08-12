import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12283F",
        "ink-soft": "#1C3A57",
        teal: "#6FB69B",
        "teal-deep": "#3E8C71",
        paper: "#F7F8F6",
        line: "#E2E6E2",
        muted: "#7A8B93",
        mist: "#EEF2EF",
        "ink-mute": "#9BB3B0",
        danger: "#B4705A",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
