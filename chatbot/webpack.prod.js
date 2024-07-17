const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  output: {
    publicPath: 'http://localhost:3000/'
  },
  optimization: {
    minimize: true,
  },
})