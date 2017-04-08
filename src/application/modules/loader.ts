import {Environment, Defer} from 'application/modules/environment';
import {debug} from 'application/modules/debug';

export class Progress {
    private _percents: number = 0;
    private _value: number = 0;
    private _max: number = 100;
    private _multiplier: number;
    private _dom: HTMLElement;

    constructor(dom: HTMLElement, multiplier: number = 1) {
        this._dom = dom;
        this._multiplier = multiplier;
    }

    set percents(value: number) {
        if (value > 100) {
            value = 100;
        }
        if (value < 0) {
            value = 0;
        }
        this._percents = value;
        if (this._dom) {
            this._dom.style.width = `${this._percents * this._multiplier}px`;
        }
    }

    get percents(): number {
        return this._percents;
    }

    set value(value: number) {
        if (value > this._max) {
            value = this._max;
        }
        if (value < 0) {
            value = 0;
        }
        this._value = value;
        this.percents = Math.round(100 / this._max * this._value);
    }

    get value(): number {
        return this._value;
    }

    set max(value: number) {
        if (value > 0) {
            this._max = value;
            if (this.value > this._max) {
                this.value = this._max;
            }
        } else {
            throw new Error('Maximum value for progress cannot be 0!');
        }
    }

    get max(): number {
        return this._max;
    }
}

export class Loader {
    environmentUrl: string = '/environment.json';
    applicationUrl: string;
    dom: HTMLElement = document.getElementById('loader');
    progress: Progress;
    private _loaded: Defer = new Defer();

    constructor(shouldToLoad: boolean = true) {
        // progress
        if (!this.dom) {
            throw new Error('No loader DOM detected!');
        }
        let progressDom: HTMLElement = document.createElement('div');
        progressDom.className = 'progress';
        progressDom.innerHTML = `<div class="fill"></div>`;
        this.dom.appendChild(progressDom);
        this.progress = new Progress(<HTMLElement>progressDom.getElementsByClassName('fill')[0], 2);
        this.progress.max = 1 /* init */ + 100 /* environment load */ + 100 /* application load */ + 1 /* finish */;
        this.progress.value = 1;
        if (shouldToLoad) {
            this.load();
        }
    }

    load() {
        let environment: Environment,
            loader: Loader = this;
        this._loadData(this.environmentUrl)
            .then((data: string) => {
                environment = new Environment(JSON.parse(data));
            })
            .then(() => {
                debug.debugMode = environment.debug;
                debug.log(`Environment file loaded...`);
            })
            .then(() => {
                environment.application.tag = environment.escapeTagName();
                environment.application.dom = document.createElement(environment.application.tag);
                environment.application.dom.setAttribute('id', 'application');
                document.body.appendChild(environment.application.dom);
                debug.log(`Application dom element created...`);
            })
            .then(() => {
                this.applicationUrl = `/${environment.application.name}.js`;
                return this._loadData(this.applicationUrl)
            })
            .then((data: any) => {
                debug.log(`Application file loaded...`);
                debug.log(` * starting eval...`);
                try {
                    debug.log('\n    loader:', loader, '\n    environment:', environment);
                    eval(data);
                    let script: HTMLElement = document.createElement('script');
                    script.innerHTML =
                        `/*
 --- APPLICATION "${environment.application.name}" (${environment.application.version}) INJECTED ---
 - From: "${this.applicationUrl[0] === '/'
                            ? location.protocol + '//' + location.host + this.applicationUrl
                            : this.applicationUrl}" -
 - Author: ${environment.application.author} -
 - License: ${environment.application.license} -
*/`;
                    document.body.appendChild(script);
                } catch (error) {
                    throw error;
                }
                debug.log(` * eval completed...`);
                return this.progress.value += 1;
            })
            .then(() => {
                let parent: Node = this.dom.parentNode;
                parent.removeChild(this.dom);
                this._loaded.resolve(true);
                this._loaded = null;
            })
            .catch((error) => {
                if (this.dom) {
                    this.dom.innerHTML = `<div class="error"><h1>ERROR!</h1><h2>${error.message}</h2></div>`;
                }
                this._loaded.reject(error);
                console.error(error);
            });
    }

    loaded(): Promise<boolean> {
        if (!this._loaded) {
            return new Promise((resolve) => {
                return resolve(true);
            });
        }
        return this._loaded.promise;
    }

    _loadData(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let request: XMLHttpRequest = new XMLHttpRequest();
            if ('onprogress' in request) {
                let lastProgressCheck: number = 0;
                request.onprogress = (event) => {
                    let currentProgressCheck = Math.round(100 / event.total * event.loaded);
                    if (currentProgressCheck - lastProgressCheck > 0) {
                        this.progress.value += currentProgressCheck - lastProgressCheck;
                        lastProgressCheck = currentProgressCheck;
                    }
                };
            }
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        if (!('onprogress' in request)) {
                            this.progress.value += 100;
                        }
                        return resolve(request.responseText);
                    } else {
                        return reject(new Error(`ERROR on GET for "${url}" with code ${request.status}!`));
                    }
                }
            };
            request.open('GET', url);
            request.send();
        });
    }
}