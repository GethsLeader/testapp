'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require("webpack-dev-middleware");

// servers data
// dev
let dsPort = 8000,
    dsHost = 'localhost';
// test
let tsPort = 8001,
    tsHost = 'localhost';

// application instance
let dapp = express(),
    tapp = express();

// webpack compiler instances
let compiler;

// webpack dev middleware instance
let wdm;

// errors handler middleware
const errorsHandlerMiddleware = function (err, req, res, next) {
    res.status(err.status || 500);
    if (err.status !== 404) {
        console.error(err);
    }
    let error = {
        status: err.status,
        message: err.message,
        stack: err.stack.split('\n')
    };
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.json(error);
    } else {
        let html = '<h1>Error ' + error.status + '</h1><p style="color: #761c19">' + error.message + '</p>';
        html += error.stack.length ? '<h3>Stack:</h3>' : '<h4>Empty stack trace...</h4>';
        for (let i = 0; i < error.stack.length; i++) {
            html += '<p>' + error.stack[i] + '</p>';
        }
        res.send(html);
    }
};

// webpack configuration
require(path.resolve(__dirname, '..', 'webpack.config.js'))
    .then((config) => {
        // compilation
        compiler = webpack(config);

        // entry point middleware applying
        dapp.use((req, res, next) => {
            let url = req.url.split('/').slice(-1).pop();
            if (req.url !== '/' && url.indexOf('.') < 0) {
                req.url = '/';
            }
            next();
        });

        if (process.env.WEBPACK_ENV === 'test' || process.env.NODE_ENV === 'test') {
            tapp.use((req, res, next) => {
                //console.log('*', req.url);
                if (req.url === '/' || req.url.indexOf('/?') === 0) {
                    res.set('Content-Type', 'text/html');
                    return res.send(compiler.outputFileSystem.readFileSync(path.resolve(__dirname, '..', 'dist', 'specs.html')));
                }
                next();
            });
        }

        // webpack dev middleware prepare
        wdm = webpackDevMiddleware(compiler, {
            contentBase: path.resolve(__dirname, '..', 'dist'),
            historyApiFallback: true,
            compress: true,
            inline: true,
            hot: true,
            staticOptions: {},
            watchOptions: {
                aggregateTimeout: 300,
                poll: 1000,
                ignored: /node_modules/
            },
            stats: {
                colors: true,
            }
        });
    })
    .then(() => {
        // webpack middleware applying
        dapp.use(wdm);
        tapp.use(wdm);
    })
    .then(() => {
        // errors handler middleware applying
        dapp.use(errorsHandlerMiddleware);
        tapp.use(errorsHandlerMiddleware);

        // servers
        console.log('trying to start dev application server on port', dsPort, 'with host', dsHost ? dsHost : '*');
        const devServer = http.createServer(dapp);
        devServer.listen(dsPort, dsHost, function () {
            console.log('dev application server created on port ' + devServer.address().port + ' with address '
                + devServer.address().address + ' (' + devServer.address().family + ')');
        });
        if (process.env.WEBPACK_ENV === 'test' || process.env.NODE_ENV === 'test') {
            console.log('trying to start test application server on port', tsPort, 'with host', tsHost ? tsHost : '*');
            const testServer = http.createServer(tapp);
            testServer.listen(tsPort, tsHost, function () {
                console.log('test application server created on port ' + testServer.address().port + ' with address '
                    + testServer.address().address + ' (' + testServer.address().family + ')');
            });
        }
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });