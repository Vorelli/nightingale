/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import tailwindcssAnimate from "tailwindcss-animate";
export default {
  //purge: ["./src/**/*.html", "./src/**/*.tsx"], // Adjust this to match your actual file extensions and paths
  content: ["./src/client/**/*.{js,jsx,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    extend: {},
  },
  plugins: [daisyui, tailwindcssAnimate],
};
