const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");
const weatherInfo = document.getElementById("weatherInfo");
const forecast = document.getElementById("forecast");

// API URLs
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// Weather descriptions
function getWeatherDescription(code) {

    const descriptions = {
        0: "Clear Sky ☀️",
        1: "Mainly Clear 🌤️",
        2: "Partly Cloudy ⛅",
        3: "Overcast ☁️",
        45: "Foggy 🌫️",
        48: "Foggy 🌫️",
        51: "Light Drizzle 🌦️",
        53: "Drizzle 🌦️",
        55: "Heavy Drizzle 🌧️",
        61: "Light Rain 🌧️",
        63: "Moderate Rain 🌧️",
        65: "Heavy Rain 🌧️",
        71: "Light Snow ❄️",
        73: "Snowfall ❄️",
        75: "Heavy Snow ❄️",
        80: "Rain Showers 🌦️",
        81: "Rain Showers 🌧️",
        82: "Heavy Rain Showers 🌧️",
        95: "Thunderstorm ⛈️",
        96: "Thunderstorm with Hail ⛈️",
        99: "Heavy Thunderstorm ⛈️"
    };

    return descriptions[code] || "Weather information unavailable";
}

// Fetch city location
async function getCityLocation(city) {

    const url = `${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to search for this city. Please try again.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please enter a valid city name.");
    }

    return data.results[0];
}

// Fetch weather
async function getWeather(latitude, longitude) {

    const url = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch weather information. Try again later.");
    }

    return await response.json();
}

// Display current weather
function displayCurrentWeather(city, data) {

    const current = data.current;

    document.getElementById("cityName").textContent =
        `${city.name}, ${city.country}`;

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("description").textContent =
        getWeatherDescription(current.weather_code);

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m;

    document.getElementById("wind").textContent =
        current.wind_speed_10m;

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);
}

// Display 5-day forecast
function displayForecast(data) {

    forecast.innerHTML = "";

    const daily = data.daily;

    daily.time.forEach((date, index) => {

        const card = document.createElement("div");
        card.className = "forecast-card";

        const day = new Date(date + "T00:00:00")
            .toLocaleDateString("en-US", {
                weekday: "short"
            });

        card.innerHTML = `
            <h3>${day}</h3>
            <p>${getWeatherDescription(daily.weather_code[index])}</p>
            <p>⬆️ ${Math.round(daily.temperature_2m_max[index])}°C</p>
            <p>⬇️ ${Math.round(daily.temperature_2m_min[index])}°C</p>
        `;

        forecast.appendChild(card);
    });
}

// Main search function
async function searchWeather() {

    const city = cityInput.value.trim();

    message.textContent = "";
    weatherInfo.classList.add("hidden");

    if (!city) {
        message.textContent = "Please enter a city name!";
        cityInput.focus();
        return;
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(city)) {
        message.textContent = "Please enter a valid city name.";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    message.style.color = "#4169e1";
    message.textContent = "Fetching weather information...";

    try {

        const location = await getCityLocation(city);

        const weatherData = await getWeather(
            location.latitude,
            location.longitude
        );

        displayCurrentWeather(location, weatherData);
        displayForecast(weatherData);

        weatherInfo.classList.remove("hidden");
        message.textContent = "";

    } catch (error) {

        message.style.color = "#d93025";
        message.textContent = error.message;

    } finally {

        searchBtn.disabled = false;
        searchBtn.textContent = "Search";

    }
}

// Search button
searchBtn.addEventListener("click", searchWeather);

// Enter key
cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchWeather();
    }

});

// Debounced city input validation
let debounceTimer;

cityInput.addEventListener("input", function() {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        if (cityInput.value.trim() === "") {
            message.textContent = "";
        }

    }, 500);

});
