export class Environment {
    production: boolean;
    debug: boolean;
    application: {
        tag: string,
        dom: HTMLElement,
        name: string,
        version: string
        description: string,
        author: string,
        license: string
    };

    constructor(properties: any) {
        if (properties) {
            this._setProperties(properties);
        }
    }

    private _setProperties(properties: any) {
        properties = properties ? properties : {};
        if (!properties.application) {
            throw new Error('Application properties cannot be empty!');
        }
        this.production = properties.production || false;
        this.debug = properties.debug || false;
        this.application = properties.application;
    };

    escapeTagName(name?: string) {
        if (!name) {
            name = this.application.name;
        }
        return name.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    }
}