const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const postcssImport = require("postcss-import");

/* export default {
  plugins: [postcssImport, autoprefixer, tailwindcss],
}; */
module.exports = {
	plugins: [postcssImport, tailwindcss, autoprefixer],
};
