import mocha from 'mocha';
import chai from 'chai';
import sinon from 'sinon';

import { App } from "../src/App.js";

const { describe, it } = mocha;
const { expect } = chai;

describe('app', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox = sandbox.restore();
    });

    describe('#loadCities', () => {
        it('Should create 2 cards', async () => {
            sandbox.stub(App.prototype, 'getFavCities').returns(['Санкт-Петербург', 'Саратов']);
            sandbox.stub(App.prototype, 'getWeatherByCityName').returns({ id: 1 });
            const card = sandbox.stub(App.prototype, 'loadCity');

            const app = new App();
            await app.loadFavorites();

            expect(card.callCount).to.equal(2);
        })
    });

    describe('#addCity', () => {

        beforeEach(() => {
            sandbox.stub(App.prototype, 'setLoader');
            sandbox.stub(App.prototype, 'unsetLoader');
            sandbox.stub(App.prototype, 'clearInput');
            sandbox.stub(App.prototype, 'importFavCity');
        });

        it('Should call addFavCity', async () => {
            const addFavorite = sandbox.stub(App.prototype, 'addFavCity').returns({ id: 1 });

            sandbox.stub(App.prototype, 'getWeatherByCityName').returns({ id: 1, name: 'Москва' });

            const app = new App();
            await app.addCity('Москва');

            expect(addFavorite.callCount).to.equal(1);
            expect(addFavorite.calledWith('Москва')).to.equal(true);
        });

        it('Should fail (empty name)', async () => {
            const addFavorite = sandbox.stub(App.prototype, 'addFavCity').returns({ id: 1 });

            sandbox.stub(App.prototype, 'getWeatherByCityName').returns({ id: 1, name: 'Москва' });

            const app = new App();
            await app.addCity('');

            expect(addFavorite.called).to.equal(false);
        });

        it('Should fail (city not found)', async () => {
            const addFavorite = sandbox.stub(App.prototype, 'addFavCity').returns({ id: 1 });

            sandbox.stub(App.prototype, 'getWeatherByCityName').returns({ id: 1, name: '000' });
            const app = new App();
            sandbox.stub(app, 'favCards').value(['000']);
            await app.addCity('000');

            expect(addFavorite.called).to.equal(false);
        });

        it('Should fail (city already added)', async () => {
            const addFavorite = sandbox.stub(App.prototype, 'addFavCity').returns({ id: 1 });

            sandbox.stub(App.prototype, 'getWeatherByCityName').returns({ id: 1, name: 'Москва' });
            const app = new App();
            sandbox.stub(app, 'favCards').value(['Москва']);
            await app.addCity('Москва');

            expect(addFavorite.called).to.equal(false);
        })
    });

    describe('#removeFavorite', () => {
        it('Should call api method deleteFavCity once', async () => {
            const removeFavorite = sandbox.stub(App.prototype, 'deleteFavCity');
            sandbox.stub(App.prototype, 'ejectCity').returns(true);

            const app = new App();
            sandbox.stub(app, 'favCards').value(['Москва', 'Саратов']);
            await app.removeCity('Москва');

            expect(removeFavorite.callCount).to.equal(1);
            expect(app.favCards).to.eql(['Саратов']);
        })
    })
});