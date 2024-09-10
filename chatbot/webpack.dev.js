const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  entry: "./src/index.tsx",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "auto"
  },
  plugins: [
    new Dotenv({
      path: path.resolve(process.cwd(),"..",".env")
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname,"..","public"),
      publicPath: "/"
    },
    compress: true,
    port: 9000,
    hot: true,
    proxy: [{ 
      context: ["/api"],
      target: "http://localhost:3000",
      secure: false
    }]
  }
});