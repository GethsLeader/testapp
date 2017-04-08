import 'zone.js/dist/zone';
import {NgModule, enableProdMode} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {debug} from 'application/modules/debug';
import {Environment} from 'application/modules/environment';
import {Loader} from 'application/modules/loader';
import {Root} from 'application/components/root';

declare let environment: Environment; // getting environment from loader application
declare let loader: Loader; // getting loader itself from loader application

if (!environment) {
    throw new Error('Application configuration not initialized!');
}

debug.debugMode = environment.debug;

debug.log('Application initialization started...');
debug.log(`* application: "${environment.application.name}"`);
debug.log(`* version: ${environment.application.version}`);
debug.log(`* description: ${environment.application.description}`);
debug.log(`* author: ${environment.application.author}`);
debug.log(`* license: ${environment.application.license}`);

loader.loaded() // when application loaded
    .then(() => {
        @NgModule({
            imports: [BrowserModule],
            declarations: [Root],
            providers: [],
            bootstrap: [Root]
        })
        class Application {
        }

        if (environment.production) {
            enableProdMode();
        }
        return platformBrowserDynamic().bootstrapModule(Application)
    })
    .then(() => {
        debug.log('Application initialization finished.');
    })
    .catch((error) => {
        throw error;
    });