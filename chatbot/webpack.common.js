const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const dotenv = require("dotenv");

const isDevelopment = !(["test", "production"].includes(process.env.NODE_ENV))

dotenv.config({ path: isDevelopment ? "../.env" : path.resolve(process.cwd(),".env.production") });

const appUrl = process.env.NEXT_PUBLIC_BASEURL;
module.exports = {
  entry: { chatbot: "./src/index.tsx" },
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    pathinfo: false,
    clean: true,
    assetModuleFilename: "[name][ext][query]",
    publicPath: appUrl ? `${appUrl}/` : "./"
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
    })
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".scss", ".sass"],
    modules: ["node_modules"],
    alias: {
      "Shared/Components": path.resolve(__dirname, "..", "lib/components"),
      "Shared/Types": path.resolve(__dirname, "..", "lib/firebase/types"),
      "Shared/Helper": path.resolve(__dirname, "..", "lib/helper"),
      "Shared/Firebase": path.resolve(__dirname, "..", "lib/firebase")
    }
  }
};
