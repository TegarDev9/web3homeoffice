import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
        border: "var(--color-border)",
        glow: "var(--color-glow)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        text: "var(--color-text)",
        muted: "var(--color-muted)"
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "calc(var(--radius-lg) - 2px)",
        sm: "calc(var(--radius-lg) - 6px)"
      },
      boxShadow: {
        neon: "0 0 18px rgba(32, 212, 255, 0.45)",
        panel: "0 12px 40px rgba(2, 6, 23, 0.35)"
      }
    }
  },
  darkMode: ["class"],
  plugins: []
};

export default config;


