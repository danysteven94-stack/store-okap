import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C81E2C",
          "red-dark": "#8F0F1B",
          black: "#0B0B0D",
          charcoal: "#1A1A1D",
          white: "#FFFFFF",
          gray: "#F4F4F5"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: { xl: "0.85rem" }
    }
  },
  plugins: []
};

export default config;
