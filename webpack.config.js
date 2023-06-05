import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
//import Dotenv from "dotenv-webpack";

const config = {
    devServer: {
        compress: true,
        host: "0.0.0.0"
    },
    entry: ["./src/client/index.tsx", "./src/client/index.css"],
    module: {
        rules: [
            {
                test: /\.css$/i,
                include: [
                    path.resolve(
                        __dirname,
                        "node_modules/.pnpm/react-pdf@7.0.1_react-dom@18.2.0_react@18.2.0/node_modules/react-pdf/dist/esm/Page"
                    ),
                    path.resolve(__dirname, "src/client")
                ],
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "postcss-loader"
                ]
            },
            {
                test: /\.tsx?$/,
                include: [path.resolve(__dirname, "src/client")],
                exclude: [/node_modules/, /server/],
                use: "ts-loader" /* {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        }, */
            }
        ]
    },
    mode: "development",
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public")
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/client/index.html")
        })
        //new Dotenv({}),
    ]
};

export default config;
