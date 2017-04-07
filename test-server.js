#!/usr/bin/env node
'use strict';

/* CONFIGURATION */

global.dirname = __dirname;

/* IMPORTS */

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');

/* SERVER APPLICATION */

const application = express();
global.application = application;

/* APPLICATION CONFIGURATION */

// static

application.set('static', path.normalize(path.join(global.dirname, 'dist')));
application.use(express.static(application.get('static')));

application.set('session key', 'TEST, TEST AND ANOTHER TEST!');
application.use(session({
    name: 'testUID',
    secret: application.get('session key'),
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // one day
    }
}));

// errors handlers

// catch 404 and forward to error handler
application.use(function (req, res, next) {
    let error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// development error handler
// will print stacktrace
if (application.get('env') === 'development') {
    application.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (err.status != 404) {
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
    });
}

// production error handler
// no stacktrace leaked to user
application.use(function (err, req, res, next) {
    res.status(err.status || 500);
    let error = {
        status: err.status,
        message: err.message
    };
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.json(error);
    } else {
        let html = '<h1>Error ' + error.status + '</h1><p style="color: #761c19">' + error.message + '</p>';
        res.send(html);
    }
});

/* SERVER INSTANCES */

let server;

const serverHost = 'localhost',
    serverPort = 8000;

// http
console.log('trying to start http server on port', serverPort, 'with host', serverHost);
server = http.createServer(application);
server.listen(serverPort, serverHost, function () {
    console.log('http server created on port ' + server.address().port + ' with address '
        + server.address().address + ' (' + server.address().family + ')');
});