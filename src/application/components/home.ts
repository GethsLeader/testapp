import {Component} from '@angular/core';
import {debug} from 'application/modules/debug';
import {EnvironmentService} from 'application/services/environment';

@Component({
    selector: EnvironmentService.environment.application.tag,
    templateUrl: '/views/home.html',
    providers: [EnvironmentService]
})
export class Home {
    constructor(private environmentService: EnvironmentService) {
        debug.log('Home component created.');
    }
}