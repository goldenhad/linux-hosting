const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  devServer: {
    static: {
        directory: path.join(__dirname,'..','public'),
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
});