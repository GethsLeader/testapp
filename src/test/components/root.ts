import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, async, ComponentFixture} from '@angular/core/testing';

import {Root} from 'application/components/root';

function rootTests() {
    let component: Root;
    let fixture: ComponentFixture<Root>;

    // async beforeEach
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [Root],
            schemas: [NO_ERRORS_SCHEMA],
            providers: []
        })
            .compileComponents(); // compile template and css
    }));

    // synchronous beforeEach
    beforeEach(() => {
        fixture = TestBed.createComponent(Root);
        component = fixture.componentInstance;

        fixture.detectChanges(); // trigger initial data binding
    });

    it(`should be readly initialized`, () => {
        expect(fixture).toBeDefined();
        expect(component).toBeDefined();
    });

    it(`should be with initialized environment`, () => {
        expect(component.environmentService).toBeDefined();
        expect(component.environmentService.application).toBeDefined();
        expect(component.environmentService.application.name).toEqual('testapp');
        expect(component.environmentService.application.version).toEqual('testversion');
        expect(component.environmentService.application.url).toEqual('/');
    });
}

export default rootTests;