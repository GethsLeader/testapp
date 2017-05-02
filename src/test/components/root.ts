import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, async, inject, ComponentFixture} from '@angular/core/testing';

import {EnvironmentService} from 'application/services/environment';
import {Root} from 'application/components/root';

function rootTests() {
    let component: Root;
    let fixture: ComponentFixture<Root>;

    // async beforeEach
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [Root],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [EnvironmentService]
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

    it(`should be with instantiated environment service`, () => {
        expect(component.environmentService).toBeDefined();
        expect(component.environmentService.application).toBeDefined();
        expect(component.environmentService.application.name).toEqual('testapp');
        expect(component.environmentService.application.version).toEqual('testversion');
        expect(component.environmentService.application.url).toEqual('/');
    });

    it(`environment service instance should be identical to provided static environment`, inject(
        [EnvironmentService], (environmentService) => {
            expect(EnvironmentService.environment.application.name).toEqual(environmentService.application.name);
            expect(EnvironmentService.environment.application.version).toEqual(environmentService.application.version);
            expect(EnvironmentService.environment.application.url).toEqual(environmentService.application.url);
        })
    );

    it(`environment service in root component should be identical to provided static environment`, () => {
        expect(EnvironmentService.environment.application.name).toEqual(component.environmentService.application.name);
        expect(EnvironmentService.environment.application.version).toEqual(component.environmentService.application.version);
        expect(EnvironmentService.environment.application.url).toEqual(component.environmentService.application.url);
    });
}

export default rootTests;