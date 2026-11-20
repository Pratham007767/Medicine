import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#627d98",
          500: "#486581",
          600: "#334e68",
          700: "#243b53",
          800: "#102a43",
          900: "#0b1d33",
          950: "#06101e",
        },
        health: {
          teal: "#0d9488",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
          blue: "#2563eb",
        },
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(16, 42, 67, 0.08), 0 4px 20px -2px rgba(16, 42, 67, 0.04)",
        "card-hover": "0 10px 25px -4px rgba(16, 42, 67, 0.12), 0 6px 16px -4px rgba(16, 42, 67, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
