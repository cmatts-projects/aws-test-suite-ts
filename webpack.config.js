const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    entry: {
        lambda: './src/index.ts',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            }
        ]
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lambda.js',
        libraryTarget: 'commonjs',
    },
    plugins: [
        new ZipPlugin({
            zipOptions: {
                forceZip64Format: false,
            },

        })
    ],
    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
    },
    mode: process.env.NODE_ENV || 'production',
    devtool: 'inline-source-map',
    target: 'node',
};