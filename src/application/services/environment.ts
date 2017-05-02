import {Injectable} from '@angular/core';
import {debug} from 'application/modules/debug';
import {Environment} from 'application/modules/environment';

@Injectable()
export class EnvironmentService extends Environment {
    constructor() {
        super(EnvironmentService.environment);
        debug.log('EnvironmentService constructed...');
    }

    static environment: Environment = window['environment'];
}