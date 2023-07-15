export function farenheitToCelciusTrigger(weatherResults) {
  if (weatherResults["Temperature (°C)"] > 60) {
    weatherResults["Temperature (°C)"] =
      (weatherResults["Temperature (°C)"] - 32) * (5 / 9);
    weatherResults["Temperature (°C)"] = parseFloat(
      weatherResults["Temperature (°C)"].toFixed(1)
    );
    return true;
  } else {
    return false;
  }
}
