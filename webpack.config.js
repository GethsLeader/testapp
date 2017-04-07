// basic imports
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const webpack = require('webpack');
const htmlMinifier = require('html-minifier');
const CleanCSS = require('clean-css');

// plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');

// default paths
const distPath = path.resolve(__dirname, './dist');
const srcPath = path.resolve(__dirname, './src');
const libsPath = path.resolve(__dirname, './node_modules');

module.exports = new Promise((resolve, reject) => {
    // application package
    const applicationPackage = JSON.parse(fs.readFileSync(path.join('package.json')));

    // default environment variables
    const buildMode = process.env.WEBPACK_ENV || process.env.NODE_ENV || 'development';
    const isDebug = buildMode === 'development' || buildMode === 'debug' || buildMode === 'test';
    const isProduction = buildMode === 'production';
    const isTest = buildMode === 'test' || buildMode === 'debug';

    // applications environment configuration
    const applicationsEnvironment = {
        production: isProduction,
        debug: isDebug,
        application: {
            name: applicationPackage.name,
            version: applicationPackage.version,
            description: applicationPackage.description,
            author: applicationPackage.author,
            license: applicationPackage.license
        }
    };

    // saving configuration to file to use it later in application
    fs.writeFileSync(path.join(srcPath, 'data', 'environment.json'),
        JSON.stringify(applicationsEnvironment),
        'utf8');

    // basic webpack configuration
    const webpackConfig = {
        entry: {},
        output: {
            path: distPath,
            filename: '[name].js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [
                {test: /\.ts$/, exclude: libsPath, loaders: ['babel-loader', 'ts-loader']}
            ]
        },
        plugins: [
            // Angular "the request of a dependency is an expression" warnings fix
            new webpack.ContextReplacementPlugin(
                /angular(\\|\/)core(\\|\/)@angular/,
                srcPath,
                {
                    // relative paths for angular async route calls
                }
            )
        ]
    };

    // files copying configuration
    let filesToCopy = [
        { // entry point
            from: path.join(srcPath, 'application', 'view.html'),
            to: path.join(distPath, 'index.html'),
            transform: function (fileContent, filePath) {
                fileContent = fileContent.toString()
                    .replace(/<title>(.*)<\/title>/, (match, title) => {
                        return `<title>${title} - ${applicationPackage.version}</title>`;
                    })
                    .replace(/<!-- LOADER INSERTION POINT -->/, (match) => {
                        return `<script src="loader.js"></script>`;
                    }).replace(/<!-- STYLES INSERTION POINT -->/, (match) => {
                        return `<link rel="stylesheet" href="styles.css">`;
                    });
                if (isProduction) {
                    fileContent = htmlMinifier.minify(fileContent, {
                        useShortDoctype: true,
                        removeAttributeQuotes: true,
                        removeRedundantAttributes: true,
                        removeComments: true,
                        collapseWhitespace: true,
                        collapseInlineTagWhitespace: true,
                        collapseBooleanAttributes: true
                    });
                }
                return fileContent;
            }
        },
        { // environment file
            from: path.join(srcPath, 'data', 'environment.json'),
            to: path.join(distPath, 'environment.json')
        },
        { // styles file
            from: path.join(srcPath, 'data', 'styles', 'styles.css'),
            to: path.join(distPath, 'styles.css'),
            transform: function (fileContent, filePath) {
                if (isProduction) {
                    return new CleanCSS({}).minify(fileContent).styles;
                }
                return fileContent;
            }
        },
        { // components views files
            context: path.join(srcPath, 'data', 'views'),
            from: path.join('**/*.html'),
            to: path.join(distPath, 'views'),
            transform: function (fileContent, filePath) {
                if (isProduction) {
                    fileContent = htmlMinifier.minify(fileContent.toString(), {
                        useShortDoctype: true,
                        removeAttributeQuotes: true,
                        removeRedundantAttributes: true,
                        removeComments: true,
                        collapseWhitespace: true,
                        collapseInlineTagWhitespace: true,
                        collapseBooleanAttributes: true
                    });
                }
                return fileContent;
            }
        }
    ];
    webpackConfig.plugins.push(new CopyWebpackPlugin(filesToCopy,
        {
            copyUnmodified: false
        })
    );

    // application entry to entries
    webpackConfig.entry['loader'] = ['babel-polyfill', path.join(srcPath, 'application', 'loader')];
    webpackConfig.entry[applicationsEnvironment.application.name] = [path.join(srcPath, 'application', 'index')];

    // minimization (only for production)
    if (isProduction) {
        webpackConfig.plugins = webpackConfig.plugins.concat([
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                },
                comments: false
            })
        ]);
    } else {
        webpackConfig.devtool = 'source-map';
        webpackConfig.plugins = webpackConfig.plugins.concat([]);
    }

    // test preparation
    if (isTest) {
        webpackConfig.entry['specs'] = ['babel-polyfill', path.join(srcPath, 'test', 'loader.spec')];
        filesToCopy.push({
            // spec entry point
            from: path.join(srcPath, 'test', 'specs.html'),
            to: path.join(distPath, 'specs.html'),
            transform: function (fileContent, filePath) {
                fileContent = fileContent.toString()
                    .replace(/<title>(.*)<\/title>/, (match, title) => {
                        return `<title>${title} (${applicationPackage.name} - ${applicationPackage.version})</title>`;
                    })
                    .replace(/<!-- SPECS INSERTION POINT -->/, (match) => {
                        return `<script src="specs.js"></script>`;
                    });
                return fileContent;
            }
        });
    }

    // styles compilation
    child_process.exec(`lessc ${path.join(srcPath, 'data', 'styles', 'styles.less')}  ${path.join(srcPath, 'data', 'styles', 'styles.css')}`,
        (error, stdout, stderr) => {
            if (error || stderr) {
                return reject(error || stderr);
            }
            return resolve(webpackConfig);
        });
});