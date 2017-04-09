// basic imports
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const webpack = require('webpack');
const htmlMinifier = require('html-minifier');

// plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SimpleLessBuilder = require(path.join(__dirname, 'simple-less-builder'));

// default paths
const distPath = path.resolve(__dirname, './dist');
const srcPath = path.resolve(__dirname, './src');
const libsPath = path.resolve(__dirname, './node_modules');

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
    const isProduction = buildMode === 'production';

    // applications environment configuration
    const applicationsEnvironment = {
        production: isProduction,
        debug: isDebug,
        application: {
            tag: escapeTagName(applicationPackage.name),
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
                    }
                ]
            })
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
                    .replace(/<!-- LOADER SCRIPTS INSERTION POINT -->/, (match) => {
                        const loaderId = 'loader',
                            loaderScript = 'init.js';
                        return `<script>
(function(document){
    var loaderElement = document.getElementById('${loaderId}'),
        loaderScript = document.createElement('script');
    loaderElement.innerHTML = 'Loading...';
    loaderScript.onerror = function loaderOnLoadError() {
                            loaderElement.innerHTML = '<div class="error"><h1>Error!</h1><h2>Unable to load scripts!</h2></div>';
                          };
    loaderScript.src = '${loaderScript}';
    document.body.appendChild(loaderScript);
})(document);
</script>`;
                    }).replace(/<!-- LOADER STYLES INSERTION POINT -->/, (match) => {
                        return `<link rel="stylesheet" href="loader.css">`;
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