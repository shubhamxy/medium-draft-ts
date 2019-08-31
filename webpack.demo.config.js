const path = require('path');
const mainWebpackConfig = require('./webpack.config');

module.exports = (env, argv) => {
    const config = mainWebpackConfig(env, argv);
    config.entry = {
        'medium-draft': './src/demo.tsx',
    };
    config.output = {
        path: path.resolve(__dirname, 'demo'),
        filename: '[name].js',
        libraryTarget: 'umd',
        globalObject: 'self',
    }

    return config;
};
