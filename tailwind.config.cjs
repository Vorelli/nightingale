/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
export default {
  purge: ["./src/**/*.html", "./src/**/*.tsx"], // Adjust this to match your actual file extensions and paths
  content: ["./public/*.html"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    extend: {},
  },
  plugins: [daisyui],
};
