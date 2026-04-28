const getTravelAdvice = (temp, weatherCondition, isWaterBody) => {
  const recommendations = [];

  // Logic 1 (Clothing)
  if (temp < 10) {
    recommendations.push("Wear thick clothes/Down jacket");
  } else if (temp > 25) {
    recommendations.push("Thin/Light clothes");
  } else {
    recommendations.push("Comfortable clothing");
  }

  // Logic 2 (Activity)
  if (isWaterBody && temp > 20) {
    recommendations.push("Swimming gear");
  }
  
  if (weatherCondition && weatherCondition.toLowerCase().includes('rain')) {
    recommendations.push("Bring an umbrella/raincoat");
  }

  return recommendations;
};

const checkMountainClarity = (currentWeather, pastPrecipitation) => {
  // Logic 3 (Visibility): "High Visibility" if rain has recently cleared.
  const isClearNow = currentWeather && (currentWeather.toLowerCase() === 'clear' || currentWeather.toLowerCase() === 'sunny');
  const rainedRecently = pastPrecipitation === true || pastPrecipitation > 0;

  if (isClearNow && rainedRecently) {
    return "High Visibility";
  }
  return "Standard Visibility";
};

module.exports = {
  getTravelAdvice,
  checkMountainClarity
};
