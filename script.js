let currentCity;
let API_TOKEN = 'test';
let API_HOST = 'http://localhost:8081';
let favCards = [];
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
  const response = await fetch(`${API_HOST}/weather/city?q=${name}`)
      .then(handleErrors)
      .catch(catchErrors);
  return response.ok ? response.json() : undefined;
}

async function getWeatherByCoords(lat, lon) {
  const response = await fetch(`${API_HOST}/weather/coordinates?lat=${lat}&lon=${lon}&api_token=${API_TOKEN}`)
      .then(handleErrors)
      .catch(catchErrors);
  return response.ok ? response.json() : undefined;
}

async function getFavCities() {
  const response = await fetch(`${API_HOST}/favourites?api_token=${API_TOKEN}`)
      .then(handleErrors)
      .catch(catchErrors);
  return response.ok ? response.json() : undefined;
}

async function addFavCity(city) {
  const response = await fetch(`${API_HOST}/favourites?city=${city}&api_token=${API_TOKEN}`, {
    method: 'POST'
  })
      .then(handleErrors)
      .catch(catchErrors);
  return response.ok ? response.json() : undefined;
}

async function deleteFavCity(city) {
  const response = await fetch(`${API_HOST}/favourites?city=${city}&api_token=${API_TOKEN}`, {
    method: 'DELETE'
  })
      .then(handleErrors)
      .catch(catchErrors);
  return response.ok ? response.json() : undefined;
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

async function removeCity(name) {
  const favCardsEl = document.getElementById('favoriteCards');
  const city = favCardsEl.querySelector(`.card[data-city-name="${name}"]`);
  console.log(city);
  if (city !== null) {
    favCardsEl.removeChild(city);
    await deleteFavCity(name);
  }
  
  const idx = favCards.indexOf(name);
  if (idx !== -1) {
    favCards.splice(idx, 1);
  }
}

async function addCity(name) {
  if (name.length > 0) {
    if (!favCards.includes(name)) {
      const favContainer = document.getElementById('favoriteCards');
      favContainer.classList.add('loading');
      const weather = await getWeatherByCityName(name);
      if (weather) {
        const template = document.getElementById('favoriteCity');

        const city = document.importNode(template.content, true);

        const el = city.children[0];
        el.querySelector('.remove')
            .addEventListener('click', e => removeCity(weather.name));

        setWeather(el, weather);

        favContainer.appendChild(city);
        await addFavCity(weather.name);
        favCards.push(weather.name);
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

    el.setAttribute('data-city-name', weather.name);
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
  favCards = await getFavCities() || [];
  favCards.forEach(name => loadCity(name));
});