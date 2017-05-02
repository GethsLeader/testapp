import {Component} from '@angular/core';
import {debug} from 'application/modules/debug';
import {EnvironmentService} from 'application/services/environment';

@Component({
    selector: EnvironmentService.environment.application.tag,
    templateUrl: '/views/root.html',
    providers: [EnvironmentService]
})
export class Root {
    constructor(public environmentService: EnvironmentService) {
        debug.log('Root component created.');
    }
}