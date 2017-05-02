import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';

import {TestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
);

import {Environment} from 'application/modules/environment';
import environmentMock from 'test/mocks/environment';

window['environment'] = new Environment(JSON.parse(environmentMock));

import loaderTests from 'test/modules/loader';
import rootComponentTests from 'test/components/root';

describe('Loader tests', () => {
    loaderTests();
});

describe('Root component and environment service', () => {
    rootComponentTests();
});
