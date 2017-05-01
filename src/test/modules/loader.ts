import {Environment} from 'application/modules/environment';
import {Loader, Progress} from 'application/modules/loader';

function loaderTests() {
    describe('Progress tests', function () {
        let progressDom: HTMLElement = document.createElement('div'),
            progress: Progress = new Progress(progressDom, 1);
        it('div should be created', (done) => {
            progressDom.style.width = '100px';
            expect(progressDom instanceof HTMLElement);
            expect(progressDom.tagName).toEqual('DIV');
            done();
        });
        it('percents should to sets dynamically', (done) => {
            progress.max = 2000;
            progress.value = 1000;
            expect(progress.percents === 50).toBeTruthy();
            progress.value = 1;
            expect(progress.percents === 0).toBeTruthy();
            progress.value = 1999;
            expect(progress.percents === 100).toBeTruthy();
            done();
        });
        it('div should to depend on percents', (done) => {
            progress.percents = 20;
            expect(progressDom.style.width).toEqual('20px');
            progress.percents = 75;
            expect(progressDom.style.width).toEqual('75px');
            done();
        });
    });
    describe('Environment tests', function () {
        let environment: Environment;
        const environmentUrl: string = '/environment.json',
            loadData: Function = Loader._loadData;
        it('environment.json should to be loaded and executed', (done) => {
            expect(loadData instanceof Function).toBeTruthy();
            loadData(environmentUrl)
                .then((data) => {
                    expect(typeof data).toEqual('string');
                    environment = new Environment(JSON.parse(data));
                    expect(environment.application).toBeDefined();
                    expect(typeof environment.application.name).toEqual('string');
                    expect(typeof environment.application.version).toEqual('string');
                    done();
                })
                .catch((error) => {
                    throw error;
                });
        });
    });
}

export default loaderTests;