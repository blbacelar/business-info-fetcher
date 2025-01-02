const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const dotenv = require("dotenv");

// Load environment variables from .env
const env = dotenv.config().parsed;

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    popup: "./src/popup.tsx",
    background: "./src/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup.html", to: "popup.html" },
      ],
    }),
    new webpack.DefinePlugin({
      "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(
        env.GOOGLE_MAPS_API_KEY
      ),
    }),
  ],
};
