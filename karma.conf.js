// basic imports
const path = require('path');

// default paths
const distPath = path.resolve(__dirname, './dist');
const srcPath = path.resolve(__dirname, './src');
const libsPath = path.resolve(__dirname, './node_modules');

module.exports = function (config) {
    config.set({
        plugins: [
            'karma-jasmine',
            'karma-typescript',
            'karma-chrome-launcher'
        ],
        frameworks: ['jasmine', 'karma-typescript'],
        files: [
            path.join(libsPath, 'babel-polyfill', 'dist', 'polyfill.js'),
            {
                pattern: path.join(srcPath, 'test', '**/*.spec.ts')
            }
        ],
        exclude: [],
        preprocessors: {
            '**/*.spec.ts': ['karma-typescript'],
        },
        karmaTypescriptConfig: {
            compilerOptions: {
                baseUrl: './src',
                module: 'commonjs',
                target: 'es6'
            },
            tsconfig: 'tsconfig.json'
        },
        reporters: ['progress', 'karma-typescript'],
        browsers: ['Chromium'],
        logLevel: config.LOG_INFO,
        port: 9876,
        colors: true,
        autoWatch: false,
        singleRun: true
    });
};