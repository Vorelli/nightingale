import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
//import Dotenv from "dotenv-webpack";

export default {
  devServer: {
    compress: true,
    host: "0.0.0.0",
  },
  entry: ["./src/client/index.tsx", "./src/client/index.css"],
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: [
          path.resolve(__dirname, "src/client"),
          path.resolve(__dirname, "node_modules"),
        ],
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.tsx?$/,
        include: [/client/],
        exclude: [/node_modules/, /server/],
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
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/client/index.html"),
    }),
    new MiniCssExtractPlugin(),
    //new Dotenv({}),
  ],
};
