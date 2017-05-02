import {Injectable} from '@angular/core';
import {debug} from 'application/modules/debug';
import {Loader} from 'application/modules/loader';

@Injectable()
export class LoaderService extends Loader {
    constructor() {
        super(LoaderService.loader);
        debug.log('LoaderService constructed...');
    }

    static loader: Loader = window['loader'];
}