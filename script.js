const API_KEY = '12ff3d16a192c591a72def9a9eb00dd0';

let currentCity;
let favCards = JSON.parse(localStorage.getItem('favorite-cards')) || [];

function handleErrors(response) {
  if (!response.ok) {
    document.getElementById('notification').classList.remove('hidden');
    setTimeout(() => document.getElementById('notification').classList.add('hidden'), 3000)
  }
  return response;
}
function catchErrors(e) {
  document.getElementById('notification').classList.remove('hidden');
  setTimeout(() => document.getElementById('notification').classList.add('hidden'), 3000)
}
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((location) => resolve(location.coords), reject)
  }).catch(e => {
  });
}

async function getWeatherByCityName(name) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&q=${name}&appid=${API_KEY}`)
      .then(handleErrors)
      .catch(catchErrors);
  return response && response.ok ? response.json() : undefined;
}

async function getWeatherByCoords(lat, lon) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      .then(handleErrors)
      .catch(catchErrors);
  return response && response.ok ? response.json() : undefined;
}

function setWeather(el, weather) {
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

function removeCity(name) {
  const favCardsEl = document.getElementById('favoriteCards');
  const city = favCardsEl.querySelector(`.card[data-city-name="${name}"]`);

  if (city !== null) {
    favCardsEl.removeChild(city);
  }
  
  const idx = favCards.indexOf(name);
  if (idx !== -1) {
    favCards.splice(idx, 1);
    localStorage.setItem('favorite-cards', JSON.stringify(favCards));
  }
}

async function addCity(name) {
  if (name.trim().length > 0) {
    if (!favCards.includes(name)) {
      const favContainer = document.getElementById('favoriteCards');
      favContainer.classList.add('loading');
      const weather = await getWeatherByCityName(name);
      if (weather && !favCards.includes(weather.name)) {
        const template = document.getElementById('favoriteCity');

        const city = document.importNode(template.content, true);

        const el = city.children[0];
        el.setAttribute('data-city-name', weather.name);
        el.querySelector('.remove')
            .addEventListener('click', e => removeCity(weather.name));

        setWeather(el, weather);

        favContainer.appendChild(city);
        favCards.push(weather.name);
        localStorage.setItem('favorite-cards', JSON.stringify(favCards));
      }
      else if (weather) {
        alert('Город уже был добавлен');
      }
      document.getElementsByName('city')[0].value = '';
      favContainer.classList.remove('loading');
    }
    else {
      alert('Город уже был добавлен');
    }
  }
}

async function loadCity(name) {
  const favContainer = document.getElementById('favoriteCards');
  const template = document.getElementById('favoriteCity');
  favContainer.classList.add('loading');
  const weather = await getWeatherByCityName(name);
  if (weather) {
    const city = document.importNode(template.content, true);

    const el = city.children[0];

    el.setAttribute('data-city-id', weather.name);
    el.querySelector('.remove')
        .addEventListener('click', e => removeCity(weather.name));

    setWeather(el, weather);
    favContainer.appendChild(city);
  }
  favContainer.classList.remove('loading');
}

async function updateLocalWeather() {
  const localWeather = document.getElementById('localWeather');

  let weather;
  if (currentCity !== undefined) {
    localWeather.classList.add('loading');
    weather = await getWeatherByCityName(currentCity);
  } else {
    const coords = await getCurrentLocation();
    if (coords) {
      localWeather.classList.add('loading');
      weather = await getWeatherByCoords(coords.latitude, coords.longitude);
    }
  }

  if (weather) {
    currentCity = weather.name;
    setWeather(localWeather, weather);
  }
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

  favCards.forEach(name => loadCity(name));
});