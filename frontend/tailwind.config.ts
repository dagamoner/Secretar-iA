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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        flashPulse: {
          "0%, 100%": { backgroundColor: "rgba(59, 130, 246, 0.25)" },
          "50%": { backgroundColor: "rgba(96, 165, 250, 0.5)" },
        }
      },
      animation: {
        flash: "flashPulse 1s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
export default config;
