export class App {
    constructor() {
        this.API_TOKEN = 'test';
        this.API_HOST = 'http://localhost:8081';
        this.currentCity = undefined;
        this.favCards = [];
    }

    handleErrors(response) {
        if (!response.ok) {
            document.getElementById('notification').classList.remove('hidden');
            setTimeout(() => document.getElementById('notification').classList.add('hidden'), 3000)
        }
        return response;
    }
    catchErrors(e) {
        document.getElementById('notification').classList.remove('hidden');
        setTimeout(() => document.getElementById('notification').classList.add('hidden'), 3000)
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((location) => resolve(location.coords), reject)
        }).catch(e => {});
    }

    async getWeatherByCityName(name) {
        const response = await fetch(`${this.API_HOST}/weather/city?q=${name}`)
            .then(this.handleErrors)
            .catch(this.catchErrors);
        return response.ok ? response.json() : undefined;
    }

    async getWeatherByCoords(lat, lon) {
        const response = await fetch(`${this.API_HOST}/weather/coordinates?lat=${lat}&lon=${lon}&api_token=${this.API_TOKEN}`)
            .then(this.handleErrors)
            .catch(this.catchErrors);
        return response.ok ? response.json() : undefined;
    }

    async getFavCities() {
        const response = await fetch(`${this.API_HOST}/favourites?api_token=${this.API_TOKEN}`)
            .then(this.handleErrors)
            .catch(this.catchErrors);
        return response.ok ? response.json() : undefined;
    }

    async addFavCity(city) {
        const response = await fetch(`${this.API_HOST}/favourites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: city,
                api_token: this.API_TOKEN
            })
        })
            .then(this.handleErrors)
            .catch(this.catchErrors);
        return response.ok ? response.json() : undefined;
    }

    async deleteFavCity(city) {
        const response = await fetch(`${this.API_HOST}/favourites`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: city,
                api_token: this.API_TOKEN
            })
        })
            .then(this.handleErrors)
            .catch(this.catchErrors);
        return response.ok ? response.json() : undefined;
    }


    setWeather(el, weather) {
        el.querySelector('.heading .city').textContent = weather.name;
        el.querySelector('.icon').src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`;
        el.querySelector('.temperature .value').textContent = Math.round(weather.main.temp);
        el.querySelector('.wind-speed').textContent = weather.wind.speed;
        el.querySelector('.wind-direction').textContent = weather.wind.deg;
        el.querySelector('.cloudness').textContent = weather.clouds.all;
        el.querySelector('.pressure').textContent = weather.main.pressure;
        el.querySelector('.humidity').textContent = weather.main.humidity;
        el.querySelector('.coords-lat').textContent = weather.coord.lat;
        el.querySelector('.coords-lon').textContent = weather.coord.lon;
    }

    ejectCity(name) {
        const favCardsEl = document.getElementById('favoriteCards');
        const city = favCardsEl.querySelector(`.card[data-city-name="${name}"]`);
        if (city !== null) {
            favCardsEl.removeChild(city);
            return true;
        }
        return false;
    }

    async removeCity(name) {
        if (this.ejectCity(name)){
            await this.deleteFavCity(name);
        }
        const idx = this.favCards.indexOf(name);
        if (idx !== -1) {
            this.favCards.splice(idx, 1);
        }
    }

    setLoader() {
        const favContainer = document.getElementById('favoriteCards');
        favContainer.classList.add('loading');
    }

    unsetLoader() {
        const favContainer = document.getElementById('favoriteCards');
        favContainer.classList.remove('loading');
    }

    clearInput() {
        document.getElementsByName('city')[0].value = '';
    }

    importFavCity() {
        const favContainer = document.getElementById('favoriteCards');
        const template = document.getElementById('favoriteCity');
        const city = document.importNode(template.content, true);
        const el = city.children[0];
        el.querySelector('.remove')
            .addEventListener('click', e => this.removeCity(weather.name));

        this.setWeather(el, weather);
        el.setAttribute('data-city-name', weather.name);
        favContainer.appendChild(city);
    }

    async addCity(name) {
        if (name.trim().length > 0) {
            if (!this.favCards.includes(name)) {
                this.setLoader();
                const weather = await this.getWeatherByCityName(name);
                if (weather) {
                    if (!this.favCards.includes(weather.name)) {
                        this.importFavCity();
                        await this.addFavCity(weather.name);
                        this.favCards.push(weather.name);
                    }
                    else {
                        alert('Город уже был добавлен');
                    }
                }
                this.clearInput();
                this.unsetLoader();
            }
            else {
                alert('Город уже был добавлен');
                this.clearInput()
            }
        }
        return this.favCards;
    }

    async loadCity(name) {
        const favContainer = document.getElementById('favoriteCards');
        const template = document.getElementById('favoriteCity');
        favContainer.classList.add('loading');
        const weather = await this.getWeatherByCityName(name);
        if (weather) {
            const city = document.importNode(template.content, true);

            const el = city.children[0];

            el.setAttribute('data-city-name', weather.name);
            el.querySelector('.remove')
                .addEventListener('click', e => this.removeCity(weather.name));

            this.setWeather(el, weather);
            favContainer.appendChild(city);
        }
        favContainer.classList.remove('loading');
    }

    async updateLocalWeather() {
        const localWeather = document.getElementById('localWeather');

        let weather;
        if (this.currentCity !== undefined) {
            localWeather.classList.add('loading');
            weather = await this.getWeatherByCityName(this.currentCity);
        } else {
            const coords = await this.getCurrentLocation();
            if (coords) {
                localWeather.classList.add('loading');
                weather = await this.getWeatherByCoords(coords.latitude, coords.longitude);
            }
        }

        if (weather) {
            this.currentCity = weather.name;
            this.setWeather(localWeather, weather);
        }
        localWeather.classList.remove('loading')
    }

    async loadFavorites() {
        this.favCards = await this.getFavCities();
        this.favCards.forEach(name => this.loadCity(name));
    }

    async start() {
        window.addEventListener('load', async () => {
            document.getElementById('refresh').addEventListener('click', this.updateLocalWeather);
            document.getElementById('refreshMobile').addEventListener('click', this.updateLocalWeather);
            this.updateLocalWeather();
            document.querySelector('.add-city')
                .addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addCity(e.target.elements['city'].value);
                });
            this.loadFavorites();
        });
    }
}