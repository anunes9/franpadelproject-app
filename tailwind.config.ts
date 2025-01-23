import type { Config } from "tailwindcss"

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        projectBlue: "#122C49",
        projectGreen: "#6bb8a4",
        projectGray: "#F4F4F4",
        green: {
          50: "#f3faf7",
          100: "#d7f0e8",
          200: "#afe0d0",
          300: "#7fc9b4",
          400: "#6bb8a4",
          500: "#3a927c",
          600: "#2d7464",
          700: "#275e53",
          800: "#234c44",
          900: "#21403a",
          950: "#0e2521",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        btn: {
          background: "hsl(var(--btn-background))",
          "background-hover": "hsl(var(--btn-background-hover))",
        },
        dimmed: "hsl(var(--dimmed))",
      },
    },
  },
  plugins: [],
} satisfies Config
