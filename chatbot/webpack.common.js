const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const dotenv = require("dotenv");
const Dotenv = require("dotenv-webpack");

dotenv.config({ path: path.resolve("../.env") });

const appUrl = process.env.APP_URL;
module.exports = {
  entry: { chatbot: "./src/index.tsx" },
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    pathinfo: false,
    clean: true,
    assetModuleFilename: "[name][ext][query]",
    publicPath: appUrl ? appUrl : "./"
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(jpg|png|svg|gif)$/,
        type: "asset/resource",
        generator: {
          emit: false
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "index.html"),
      filename: "index.html"
    }),
    new Dotenv({
      path: path.resolve("../.env")
    })
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".scss", ".sass"],
    modules: ["node_modules"],
    alias: {
      "Shared/Components": path.resolve(__dirname, "..", "components"),
      "Shared/Types": path.resolve(__dirname, "..", "/firebase/types"),
      "Shared/Helper": path.resolve(__dirname, "..", "helper"),
      "Shared/Firebase": path.resolve(__dirname, "..", "firebase")
    }
  }
};
