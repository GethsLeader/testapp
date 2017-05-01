// basic imports
const path = require('path');
const fs = require('fs');
const os = require('os');
const child_process = require('child_process');
const webpack = require('webpack');
const htmlMinifier = require('html-minifier');
const replacer = require(path.join(__dirname, 'tools', 'modules', 'replacer'));

// plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SimpleLessBuilder = require(path.join(__dirname, 'tools', 'webpack-plugins', 'simple-less-builder'));

// default paths
const distPath = path.join(__dirname, 'dist');
const srcPath = path.join(__dirname, 'src');
const libsPath = path.join(__dirname, 'node_modules');
const partsPath = path.join(__dirname, 'tools', 'replacement-parts');
const tmpPath = os.tmpdir();

// helpers
function escapeTagName(name) {
    return name.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
}

module.exports = new Promise((resolve, reject) => {
    // application package
    const applicationPackage = JSON.parse(fs.readFileSync(path.join('package.json')));

    // default environment variables
    const buildMode = process.env.WEBPACK_ENV || process.env.NODE_ENV || 'development';
    const isDebug = buildMode === 'development' || buildMode === 'debug' || buildMode === 'test';
    const isTest = buildMode === 'test';
    const isProduction = buildMode === 'production';

    // applications environment configuration
    const applicationsEnvironment = {
        production: isProduction,
        debug: isDebug,
        application: {
            tag: escapeTagName(applicationPackage.name), // application selector
            url: '/', // application <base href="/something"> in head tag (for routing)
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
        name: `${applicationsEnvironment.application.tag}-${isProduction ? 'production' : 'development'}`,
        entry: {},
        output: {
            path: distPath,
            filename: '[name].js'
        },
        resolve: {
            modules: [
                srcPath,
                libsPath
            ],
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
            ),
            new SimpleLessBuilder({
                src: srcPath,
                minimize: isProduction,
                files: [
                    {
                        from: path.join(srcPath, 'data', 'styles', 'loader.less'),
                        to: path.join(distPath, 'loader.css')
                    },
                    {
                        from: path.join(srcPath, 'data', 'styles', 'application.less'),
                        to: path.join(distPath, applicationsEnvironment.application.tag + '.css')
                    },
                    {
                        from: path.join(srcPath, 'data', 'styles', 'test.less'),
                        to: path.join(distPath, 'test.css')
                    }
                ]
            })
        ]
    };

    // files copying configuration
    let filesToCopy = [
        { // environment file
            from: path.join(srcPath, 'data', 'environment.json'),
            to: path.join(distPath, 'environment.json')
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

    if (isTest) {
        // jasmine standalone scripts
        filesToCopy.push({
            from: path.join(libsPath, 'jasmine-core', 'lib', 'jasmine-core', 'jasmine.js'),
            to: path.join(distPath, 'jasmine', 'jasmine.js')
        });
        filesToCopy.push({
            from: path.join(libsPath, 'jasmine-core', 'lib', 'jasmine-core', 'jasmine-html.js'),
            to: path.join(distPath, 'jasmine', 'jasmine-html.js')
        });
        filesToCopy.push({
            from: path.join(libsPath, 'jasmine-core', 'lib', 'jasmine-core', 'boot.js'),
            to: path.join(distPath, 'jasmine', 'boot.js')
        });
        filesToCopy.push({
            from: path.join(libsPath, 'jasmine-core', 'lib', 'jasmine-core', 'jasmine.css'),
            to: path.join(distPath, 'jasmine', 'jasmine.css')
        });
        // test entry point
        filesToCopy.push({
            from: path.join(srcPath, 'test', 'view.html'),
            to: path.join(distPath, 'specs.html'),
            transform: function (fileContent, filePath) {
                fileContent = fileContent.toString()
                    .replace(/<title>(.*)<\/title>/, (match, title) => {
                        return replacer(fs.readFileSync(path.join(partsPath, 'title.html')), [title, applicationPackage.version]);
                    })
                    .replace(/<!-- JASMINE STYLES INSERTION POINT -->/, () => {
                        return fs.readFileSync(path.join(partsPath, 'jasmine-styles.html'));
                    })
                    .replace(/<!-- SPECS STYLES INSERTION POINT -->/, () => {
                        return fs.readFileSync(path.join(partsPath, 'specs-styles.html'));
                    })
                    .replace(/<!-- JASMINE SCRIPTS INSERTION POINT -->/, () => {
                        return fs.readFileSync(path.join(partsPath, 'jasmine-scripts.html'));
                    })
                    .replace(/<!-- SPECS SCRIPTS INSERTION POINT -->/, () => {
                        return fs.readFileSync(path.join(partsPath, 'specs-scripts.html'));
                    });
                return fileContent;
            }
        });
    }

    // application entry point
    filesToCopy.push({
        from: path.join(srcPath, 'application', 'view.html'),
        to: path.join(distPath, 'index.html'),
        transform: function (fileContent, filePath) {
            fileContent = fileContent.toString()
                .replace(/<title>(.*)<\/title>/, (match, title) => {
                    return replacer(fs.readFileSync(path.join(partsPath, 'title.html')), [title, applicationPackage.version]);
                })
                .replace(/<!-- LOADER SCRIPTS INSERTION POINT -->/, () => {
                    return replacer(fs.readFileSync(path.join(partsPath, 'loader-scripts.html')), ['loader', 'init.js']);
                }).replace(/<!-- LOADER STYLES INSERTION POINT -->/, () => {
                    return fs.readFileSync(path.join(partsPath, 'loader-styles.html'));
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
    });

    webpackConfig.plugins.push(new CopyWebpackPlugin(filesToCopy,
        {
            copyUnmodified: false
        })
    );

    // application entry to entries
    if (isTest) {
        webpackConfig.entry['test'] = ['babel-polyfill', path.join(srcPath, 'test', 'run')];
    }
    webpackConfig.entry['init'] = ['babel-polyfill', path.join(srcPath, 'application', 'init')];
    webpackConfig.entry[applicationsEnvironment.application.tag] = [path.join(srcPath, 'application', 'run')];

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

    // done
    return resolve(webpackConfig);
});