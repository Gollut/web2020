const API_KEY = '12ff3d16a192c591a72def9a9eb00dd0';

let currentCity;

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((location) => resolve(location.coords), reject)
  })
}

async function getWeatherByCityName(name) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&q=${name}&appid=${API_KEY}`);
  return response.json()
}

async function getWeatherByCityID(id) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&id=${id}&appid=${API_KEY}`);
  return response.json()
}

async function getWeatherByCoords(lat, lon) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  return response.json()
}

function setWeather(el, weather) {
  el.querySelector('.city').textContent = weather.name;
  el.querySelector('.icon').src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`;
  el.querySelector('.temperature .value').textContent = Math.round(weather.main.temp);
  el.querySelector('.attrs-list .wind-speed').textContent = weather.wind.speed;
  el.querySelector('.attrs-list .wind-direction').textContent = weather.wind.deg;
  el.querySelector('.attrs-list .cloudness').textContent = weather.clouds.all;
  el.querySelector('.attrs-list .pressure').textContent = weather.main.pressure;
  el.querySelector('.attrs-list .humidity').textContent = weather.main.humidity;
  el.querySelector('.attrs-list .coords-lat').textContent = weather.coord.lat;
  el.querySelector('.attrs-list .coords-lon').textContent = weather.coord.lon;
}

function removeCity(id) {
  const favCards = document.getElementById('favorite-cards');
  const city = favCards.querySelector(`.weather[data-city-id="${id}"]`);

  if (city !== null) {
    favCards.removeChild(city);
  }
  
  const idx = favCards.indexOf(id);
  if (idx !== -1) {
    favCards.splice(idx, 1);
    localStorage.setItem('favourite-cards', JSON.stringify(favCards));
  }
}

async function addCity(name) {
  if (name.length === 0) {
    return
  }

  try {
    const weather = await getWeatherByCityName(name);
    if (!favCards.includes(weather.id)) {
      const favContainer = document.getElementById('favoriteCards');
      const template = document.getElementById('favoriteCity');

      const city = document.importNode(template.content, true);

      const el = city.children[0];

      el.setAttribute('data-city-id', weather.id);
      el.querySelector('.weather-remove')
        .addEventListener('click', e => removeCity(weather.id));

      setWeather(el, weather);

      favContainer.appendChild(city);
      favCards.push(weather.id);
      localStorage.setItem('favorite-cards', JSON.stringify(favCards))
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadCity(id) {
  const weather = await getWeatherByCityID(id);
  const favCards = document.getElementById('favoriteCards');
  const template = document.getElementById('favoriteCity');

  const city = document.importNode(template.content, true);

  const el = city.children[0];

  el.setAttribute('data-city-id', weather.id);
  el.querySelector('.weather-remove')
    .addEventListener('click', e => removeCity(weather.id));

  setWeather(el, weather);

  favCards.appendChild(city)
}

async function updateLocalWeather() {
  const localWeather = document.getElementById('localWeather');
  localWeather.classList.add('loading');

  let weather;
  if (currentCity !== undefined) {
    weather = await getWeatherByCityID(currentCity)
  } else {
      weather = await getWeatherByCityName('Санкт Петербург');
      setWeather(localWeather, weather);

      const coords = await getCurrentLocation();
      weather = await getWeatherByCoords(coords.latitude, coords.longitude)
  }

  currentCity = weather.id;
  setWeather(localWeather, weather);

  localWeather.classList.remove('loading')
}

window.addEventListener('load', async () => {
  document.getElementById('refresh').addEventListener('click', updateLocalWeather);
  document.getElementById('refreshMobile').addEventListener('click', updateLocalWeather);
  updateLocalWeather();
  document.querySelector('.add-city')
    .addEventListener('submit', (e) => {
      e.preventDefault();
      addCity(e.target.elements['city'].value)
    });

  let favCards = [];

  try {
    favCards = JSON.parse(localStorage.getItem('favoriteCards'));
  } catch (e) {
    console.error(e)
  }
  favCards.forEach(id => loadCity(id))
});