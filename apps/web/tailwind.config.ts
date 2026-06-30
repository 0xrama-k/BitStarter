import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111416",
        line: "#d9d4c9",
        panel: "#f4f1eb",
        paper: "#fffdf8",
        accent: "#0f766e",
        signal: "#b7791f"
      }
    }
  },
  plugins: []
};

export default config;
