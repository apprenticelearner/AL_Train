const HtmlWebpackPlugin = require('html-webpack-plugin');
// const LiveReloadPlugin = require('webpack-livereload-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'index_bundle.js',
  },
  target: 'web',
  devServer: {
    port: '5000',
    static: {
      directory: path.join(__dirname, 'public')
  },
    open: true,
    hot: true,
    liveReload: true,
  },
  // watchOptions: {
  //   ignored: '**/node_modules/',
  // },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css'],
    alias: { react: path.resolve('./node_modules/react')}
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, 
        exclude: /node_modules/, 
        loader: 'babel-loader', 
        options: { presets: ['@babel/env','@babel/preset-react'] }
      },
      {
        test: /\.(css)$/, 
        exclude: /node_modules/, 
        use: [ 'style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i, 
        loader: 'file-loader',
        options: {
          // name: '/public/icons/[name].[ext]',
          esModule : false
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html')
    }),
    // new LiveReloadPlugin()
  ],
  devtool : 'inline-source-map'
};
