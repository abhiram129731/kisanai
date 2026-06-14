const apiKey = '07045f48ef4ffa21f261c7c04d06e301';
const lat = 18.4386;
const lng = 79.1288;

console.log('Testing OpenWeatherMap API key...');
fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`)
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => {
    if (data.main) {
      console.log('SUCCESS: Weather data retrieved successfully!');
      console.log('Current Temp:', data.main.temp);
      console.log('Description:', data.weather[0].description);
    } else {
      console.log('FAILURE: API response:', data);
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
