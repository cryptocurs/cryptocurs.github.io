var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require( 'html-webpack-plugin' );
var moment = require('moment');

var development = process.argv[1].indexOf('webpack-dev-server') >= 0

console.log({ development })

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'build' + moment().format('YYYYMMDDHHmmss') + '.js'
  },
  module: {
    rules: [
      { test: /\.(js)$/, use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            "transform-class-properties",
            "babel-plugin-transform-decorators-legacy",
            "babel-plugin-transform-decorators",
          ],
        },
      }, exclude: /node_modules/ },
      { test: /\.(css)$/, use: [ 'style-loader', 'css-loader' ] },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader?mimetype=image/svg+xml' },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, use: "file-loader?mimetype=application/font-woff" },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, use: "file-loader?mimetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, use: "file-loader?mimetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: "file-loader" },
      { test: /\.gif(\?v=\d+\.\d+\.\d+)?$/, use: "file-loader?mimetype=image/gif" }
    ]
  },
  resolve: {
    alias: {
      node_modules: path.resolve('./node_modules'),
      components: path.resolve('./src/components'),
      modules: path.resolve('./src/modules'),
      assets: path.resolve('./src/assets')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    !development && new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: true,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true
      },
      output: {
        comments: false
      }
    }) || function() {},
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': development ? `"development"` : `"production"`
      }
    }),
  ]
}