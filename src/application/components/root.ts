import {Component} from '@angular/core';
import {debug} from './../modules/debug';

declare let environment: any; // getting environment from loader application

@Component({
    selector: environment.application.tag,
    templateUrl: '/views/root.html'
})
export class Root {
    environment: any = environment;

    constructor() {
        debug.log('Root component created.');
    }
}