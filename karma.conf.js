// basic imports
const path = require('path');

// default paths
const distPath = path.resolve(__dirname, './dist');
const srcPath = path.resolve(__dirname, './src');
const libsPath = path.resolve(__dirname, './node_modules');

module.exports = function (config) {
    config.set({
        frameworks: ['jasmine', 'karma-typescript'],
        files: [
            path.join(libsPath, 'babel-polyfill', 'dist', 'polyfill.js'),
            {pattern: path.join(srcPath, 'test', '**/*.ts')},
        ],
        exclude: [],
        preprocessors: {
            '**/*.ts': ['babel', 'karma-typescript'],
        },
        babelPreprocessor: {
            options: {
                presets: ['es2015'],
                sourceMap: 'inline'
            }
        },
        reporters: ['progress', 'karma-typescript'],
        browsers: ['Chromium'],
        logLevel: config.LOG_WARN,
        port: 9876,
        colors: true,
        autoWatch: false,
        singleRun: true
    });
};