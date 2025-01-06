const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const dotenv = require("dotenv");

// Load environment variables from .env
const env = dotenv.config().parsed;

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "inline-source-map",
  entry: {
    popup: "./src/popup.tsx",
    background: "./src/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  watch: process.env.NODE_ENV === "development",
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000,
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
      {
        test: /\.(png|jpg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      process: require.resolve("process/browser"),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "public/popup.html",
          to: "popup.html",
        },
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/assets", to: "assets", noErrorOnMissing: true },
      ],
    }),
    new webpack.DefinePlugin({
      "process.env": {
        GOOGLE_MAPS_API_KEY: JSON.stringify(env.GOOGLE_MAPS_API_KEY),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
      },
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      React: "react",
    }),
  ],
};
