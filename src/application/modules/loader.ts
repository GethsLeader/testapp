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
    applicationScriptUrl: string;
    applicationStyleUrl: string;
    dom: HTMLElement = document.getElementById('loader');
    progress: Progress;
    private _shouldToLoad: boolean;
    private _loaded: Defer = new Defer();

    // constructor(shouldToLoad: boolean);
    // constructor(loader: Loader);
    constructor(shouldToLoadOrLoader?: boolean | Loader) {
        if (!shouldToLoadOrLoader || shouldToLoadOrLoader === true) {
            this._shouldToLoad = <boolean>shouldToLoadOrLoader;
            // progress
            if (!this.dom) {
                throw new Error('No loader DOM detected!');
            }
            let progressDom: HTMLElement = document.createElement('div');
            progressDom.className = 'progress';
            progressDom.innerHTML = `<div class="fill"></div>`;
            this.dom.appendChild(progressDom);
            this.progress = new Progress(<HTMLElement>progressDom.getElementsByClassName('fill')[0], 2);
            this.progress.max = 2 /* init */
                + 100 /* environment load */
                + 1 /* base dom preparation */
                + 100 /* application style load */
                + 100 /* application script load */
                + 1 /* finish */;
            let noScriptElement: HTMLElement = document.getElementsByTagName('noscript')[0],
                scriptsElements: NodeListOf<HTMLScriptElement> = document.getElementsByTagName('script');
            this.progress.max += scriptsElements.length; // dom scripts cut
            this.progress.value = 2;
            noScriptElement.parentNode.removeChild(noScriptElement);
            this.progress.value++;
            do {
                scriptsElements[0].parentNode.removeChild(scriptsElements[0]);
                scriptsElements = document.getElementsByTagName('script');
                this.progress.value++;
            } while (scriptsElements.length > 0);
            if (this._shouldToLoad) {
                this.load();
            }
        } else {
            this.assign(<Loader>shouldToLoadOrLoader);
        }
    }

    assign(loader: Loader) {
        this.environmentUrl = loader.environmentUrl;
        this.applicationScriptUrl = loader.applicationScriptUrl;
        this.applicationStyleUrl = loader.applicationStyleUrl;
        this.dom = loader.dom;
        this.progress = loader.progress;
        this._shouldToLoad = loader._shouldToLoad;
        this._loaded = loader._loaded;
    }

    load() {
        let environment: Environment;
        Loader._loadData(this.environmentUrl, this.progress)
            .then((data: string) => {
                environment = new Environment(JSON.parse(data));
                window['environment'] = environment;
            })
            .then(() => {
                debug.debugMode = environment.debug;
                debug.log(`Environment file loaded...`);
            })
            .then(() => {
                if (environment.application.url) {
                    let baseElement: HTMLBaseElement = document.createElement('base');
                    baseElement.href = environment.application.url;
                    document.getElementsByTagName('head')[0].appendChild(baseElement);
                    debug.log(`Base tag for url "${environment.application.url}" appended...`);
                    this.progress.value += 1;
                }
            })
            .then(() => {
                environment.application.tag = environment.escapeTagName();
                environment.application.dom = document.createElement(environment.application.tag);
                environment.application.dom.setAttribute('id', 'application');
                document.body.appendChild(environment.application.dom);
                debug.log(`Application dom element created...`);
            })
            .then(() => {
                this.applicationStyleUrl = `/${environment.application.tag}.css`;
                return Loader._loadData(this.applicationStyleUrl, this.progress)
            })
            .then((data: any) => {
                debug.log(`Application style file loaded...`);
                let style: HTMLElement = document.createElement('style');
                style.innerHTML = data;
                document.head.appendChild(style);
            })
            .then(() => {
                this.applicationScriptUrl = `/${environment.application.tag}.js`;
                return Loader._loadData(this.applicationScriptUrl, this.progress)
            })
            .then((data: any) => {
                debug.log(`Application script file loaded...`);
                debug.log(` * starting eval...`);
                try {
                    debug.log('\n    loader:', this, '\n    environment:', environment);
                    eval(data);
                    let script: HTMLElement = document.createElement('script');
                    script.innerHTML =
                        `/*
 --- APPLICATION "${environment.application.name}" (${environment.application.version}) INJECTED ---
 - From: "${this.applicationScriptUrl[0] === '/'
                            ? location.protocol + '//' + location.host + this.applicationScriptUrl
                            : this.applicationScriptUrl}" -
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
                environment.application.dom.innerHTML = `<div class="loading"><i>Loading...</i></div>`;
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

    static _loadData(url: string, progress?: Progress): Promise<any> {
        return new Promise((resolve, reject) => {
            let request: XMLHttpRequest = new XMLHttpRequest();
            if ('onprogress' in request) {
                let lastProgressCheck: number = 0;
                request.onprogress = (event) => {
                    let currentProgressCheck = Math.round(100 / event.total * event.loaded);
                    if (currentProgressCheck - lastProgressCheck > 0) {
                        if (progress) {
                            progress.value += currentProgressCheck - lastProgressCheck;
                        }
                        lastProgressCheck = currentProgressCheck;
                    }
                };
            }
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        if (!('onprogress' in request)) {
                            if (progress) {
                                progress.value += 100;
                            }
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