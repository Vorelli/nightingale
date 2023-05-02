import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
//import Dotenv from "dotenv-webpack";

export default {
  entry: ["./src/client/index.tsx", "./src/client/index.css"],
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, "src/client"),
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader" /* {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        }, */,
      },
    ],
  },
  mode: "development",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"),
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "src/client/index.html") }),
    new MiniCssExtractPlugin(),
    //new Dotenv({}),
  ],
};
