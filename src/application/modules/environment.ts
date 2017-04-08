interface IApplication {
    tag: string,
    dom: HTMLElement,
    name: string,
    version: string
    description: string,
    author: string,
    license: string
}

interface IEnvironment {
    production: boolean;
    debug: boolean;
    application: IApplication
}

export class Environment implements IEnvironment {
    production: boolean;
    debug: boolean;
    application: IApplication;

    constructor(properties?: IEnvironment) {
        if (properties) {
            this.assign(properties);
        }
    }

    assign(properties: IEnvironment): Environment {
        this.production = properties.production || false;
        this.debug = properties.debug || false;
        this.application = properties.application;
        return this;
    };

    escapeTagName(name?: string) {
        if (!name) {
            name = this.application.name;
        }
        return name.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    }
}

export class Defer {
    promise: Promise<boolean>;
    resolve: Function;
    reject: Function;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}