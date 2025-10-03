import path from 'path';
import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

type Env = {
  production?: boolean;
  development?: boolean;
};

type WebpackConfig = Configuration & { devServer?: DevServerConfiguration };

const buildConfig = (env: Env = {}): WebpackConfig => {
  const isProduction = env.production ?? process.env.NODE_ENV === 'production';
  const rootDir = process.cwd();

  return {
    mode: isProduction ? 'production' : 'development',
    entry: path.resolve(rootDir, 'src', 'index.tsx'),
    output: {
      path: path.resolve(rootDir, 'dist'),
      filename: isProduction ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: path.resolve(rootDir, 'src'),
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/i,
          type: 'asset',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(rootDir, 'public', 'index.html'),
      }),
      new ForkTsCheckerWebpackPlugin(),
    ],
    devServer: {
      static: {
        directory: path.resolve(rootDir, 'public'),
      },
      historyApiFallback: true,
      hot: true,
      port: 5173,
      open: false,
    },
    stats: 'minimal',
    infrastructureLogging: {
      level: 'warn',
    },
  };
};

export default buildConfig;
