#!/usr/bin/env node
'use strict';

// basic imports
const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

// loading config
require(path.join(__dirname, 'webpack.config.js'))
    .then((config) => {
        config.entry['loader'].unshift("webpack-dev-server/client?http://localhost:8000/");
        const server = new WebpackDevServer(webpack(config), {
            inline: true,
            hot: true
        });
        server.listen(8000);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });