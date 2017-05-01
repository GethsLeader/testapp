import {Component} from '@angular/core';
import {debug} from 'application/modules/debug';
import {Environment} from 'application/modules/environment';

let environment: Environment = window['environment'];

@Component({
    selector: environment.application.tag,
    templateUrl: '/views/root.html'
})
export class Root {
    environment: Environment = environment;

    constructor() {
        debug.log('Root component created.');
    }
}