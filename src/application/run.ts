import 'zone.js/dist/zone';
import {NgModule, enableProdMode} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {RouterModule} from '@angular/router';

import {debug} from 'application/modules/debug';
import {LoaderService} from 'application/services/loader';
import {EnvironmentService} from 'application/services/environment';
import {Root} from 'application/components/root';
import {Home} from 'application/components/home';

if (!EnvironmentService.environment) {
    throw new Error('Application configuration not initialized!');
}

debug.debugMode = EnvironmentService.environment.debug;

debug.log('Application initialization started...');
debug.log(`* application: "${EnvironmentService.environment.application.name}"`);
debug.log(`* version: ${EnvironmentService.environment.application.version}`);
debug.log(`* description: ${EnvironmentService.environment.application.description}`);
debug.log(`* author: ${EnvironmentService.environment.application.author}`);
debug.log(`* license: ${EnvironmentService.environment.application.license}`);

LoaderService.loader.loaded() // when application loaded
    .then(() => {
        @NgModule({
            imports: [BrowserModule, RouterModule.forRoot([
                {path: '', redirectTo: 'home', pathMatch: 'full'},
                {path: 'home', component: Home}
            ])],
            declarations: [Root, Home],
            providers: [],
            bootstrap: [Root]
        })
        class Application {
        }

        if (EnvironmentService.environment.production) {
            enableProdMode();
        }
        return platformBrowserDynamic().bootstrapModule(Application)
    })
    .then(() => {
        debug.log('Application initialization finished.');
    })
    .catch((error) => {
        EnvironmentService.environment.application.dom.innerHTML = `<div class="error"><h1>Error!</h1><h2>"${error.message}"</h2></div>`;
        throw error;
    });