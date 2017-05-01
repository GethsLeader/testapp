// basic imports
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

class Defer {
    constructor() {
        this.resolve = null;
        this.reject = null;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

module.exports = class SimpleLessBuilder {
    constructor(options) {
        if (!options) {
            throw new Error('Options for less compilation cannot be empty! Set src and dist properties!');
        }
        if (!options.src) {
            throw new Error('Options for less compilation cannot be without src property!');
        }
        if (!options.files) {
            throw new Error('Options for less compilation cannot be without files property!');
        }
        this.src = options.src;
        this.files = options.files;
        this.minimize = options.minimize;
        this.dist = null;
        this._compilationEmit = null;
        this._compilationAfter = null;
        this._callbackEmit = null;
        this._callbackAfter = null;
        this._current = null;
    }

    _do() {
        if (!this._current && this._current !== 0) {
            this._current = 0;
        } else {
            this._current++;
        }
        if (this.files[this._current]) {
            return child_process.exec(`lessc ${this.files[this._current].from}`,
                (error, stdout, stderr) => {
                    if (error || stderr) {
                        this._error(error || stderr);
                        this.files[this._current].defer.reject(error || stderr);
                    } else {
                        if (this.minimize) {
                            this._save(this.files[this._current].to, new CleanCSS({advanced: true}).minify(stdout).styles);
                            this.files[this._current].defer.resolve(true);
                        } else {
                            this._save(this.files[this._current].to, stdout);
                            this.files[this._current].defer.resolve(true);
                        }
                    }
                    return this._finish();
                });
        } else {
            return this._finish();
        }
    }

    _error(error) {
        this._compilationEmit.errors.push(error);
    };

    _save(filename, data) {
        this._compilationEmit.assets[filename] = {
            source: () => {
                return data;
            },
            size: () => {
                return data.length;
            }
        }
    }

    _finish() {
        if (this._current >= this.files.length) {
            this._current = null;
            this._callbackEmit();
        }
    }

    apply(compiler) {
        compiler.plugin("emit", (compilation, callback) => {
            this._compilationEmit = compilation;
            this._callbackEmit = callback;
            this.dist = compiler.outputPath;
            for (let i = 0; i < this.files.length; i++) {
                this.files[i] = {
                    defer: new Defer(),
                    from: path.join(this.src, this.files[i].from.replace(this.src, '')),
                    to: path.join(this.files[i].to.replace(this.dist, ''))
                };
                if (this.files[i].to[0] === path.sep) {
                    this.files[i].to = this.files[i].to.substring(1);
                }
                if (this._compilationEmit.fileDependencies.indexOf(this.files[i].from) < 0) {
                    this._compilationEmit.fileDependencies.push(this.files[i].from);
                }
                this.files[i].defer.promise.then(this._do.bind(this)).catch(this._do.bind(this));
            }
            this._do();
        });
        compiler.plugin('after-emit', (compilation, callback) => {
            this._compilationAfter = compilation;
            this._callbackAfter = callback;
            for (let i = 0; i < this.files.length; i++) {
                if (this._compilationAfter.fileDependencies.indexOf(this.files[i].from) < 0) {
                    this._compilationAfter.fileDependencies.push(this.files[i].from);
                }
            }
            callback();
        });
    }
};