import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        mendoza: {
          blue: "#000f9f",       // Pantone Blue 072 C (Azul Institucional Mendoza)
          darkBlue: "#000966",   // Deep shade for hovers & dark mode
          sky: "#3cb4e5",        // Pantone 298 C (Celeste Institucional Mendoza)
          gold: "#c8a977",       // Pantone 466 C (Dorado/Ocre Institucional Mendoza)
          goldLight: "#f4eedf",  // Soft tint for backgrounds
          blueLight: "#e6e9fc",  // Soft blue tint
        },
      },
      fontFamily: {
        sans: ["REM", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        rem: ["REM", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
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
