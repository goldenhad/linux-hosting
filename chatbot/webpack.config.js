const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const dotenv = require('dotenv');
const { DefinePlugin } = require("webpack");

dotenv.config({ path: '../.env' });
module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'chat-bot.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'resolve-url-loader', 
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          }
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html',
    }),
    new DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss', '.sass'],
    modules: ['node_modules'],
    alias: {
      "Shared/Components": path.resolve(__dirname, "..", "components"),
      "Shared/Types": path.resolve(__dirname, "..","/firebase/types"),
      "Shared/Helper": path.resolve(__dirname, "..","helper"),
      "Shared/Firebase": path.resolve(__dirname, "..","firebase"),
    }
  },
  devServer: {
    static: {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
    },
    compress: true,
    port: 9000,
    hot: true,
    proxy: [{ 
      context: ['/api'],
      target: 'http://localhost:3000',
      secure: false, 
    }]
  },
};
