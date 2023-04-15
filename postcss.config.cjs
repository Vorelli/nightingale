import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";

/* export default {
  plugins: [postcssImport, autoprefixer, tailwindcss],
}; */
module.exports = {
  plugins: [postcssImport, tailwindcss, autoprefixer],
};
