#!/usr/bin/env node
'use strict';

// basic imports
const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

// loading config
require(path.resolve(__dirname, '../webpack.config.js'))
    .then((config) => {
        config.entry['init'].unshift('webpack-dev-server/client?http://localhost:8000/');
        const server = new WebpackDevServer(webpack(config), {
            contentBase: path.join(__dirname, 'dist'),
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
        server.listen(8000);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });