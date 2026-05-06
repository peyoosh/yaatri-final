const Destination = require('../models/Destination');
const { getTravelAdvice, checkMountainClarity } = require('../utils/weatherLogic');

const calculatePersonalizedScore = (destination, userPreferences) => {
  let score = destination.popularityScore || 0;
  if (!userPreferences) return score;

  const prefs = userPreferences.toLowerCase().split(',').map(p => p.trim()).filter(Boolean);
  const destString = `${destination.name} ${destination.region} ${destination.description} ${destination.terrainType}`.toLowerCase();

  prefs.forEach(pref => {
    if (destString.includes(pref)) {
      score += 15; // Significant boost for preference match
    }
  });

  return score;
};

const getAllDestinations = async (user) => {
  const destinations = await Destination.find().lean();

  if (user && user.preferences) {
    // Personalize ranking based on user preferences
    destinations.forEach(dest => {
      dest.personalizedScore = calculatePersonalizedScore(dest, user.preferences);
    });
    destinations.sort((a, b) => b.personalizedScore - a.personalizedScore);
  } else {
    // Default ranking by popularity
    destinations.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
  }

  return destinations;
};

const getDestinationById = async (id) => {
  const destination = await Destination.findById(id)
    .populate('assignedHotels', 'name basePrice totalRooms features')
    .populate('assignedGuides', 'username profileData');
    
  if (!destination) {
    return null;
  }

  // Mock weather data based on destination coordinates
  const mockTemp = Math.floor(Math.random() * 35); // Random temp between 0 and 35
  const mockWeatherCondition = Math.random() > 0.5 ? 'Clear' : 'Rain';
  const mockPastPrecipitation = Math.random() > 0.5;
  const isWaterBody = destination.environmentalTips?.isNaturalWaterBody || false;

  const clothingAdvice = getTravelAdvice(mockTemp, mockWeatherCondition, isWaterBody);
  const visibilityStatus = checkMountainClarity(mockWeatherCondition, mockPastPrecipitation);

  const liveAdvice = {
    weather: {
      temp: mockTemp,
      condition: mockWeatherCondition
    },
    clothingTips: clothingAdvice,
    visibilityStatus: visibilityStatus
  };

  const destinationObj = destination.toObject();
  destinationObj.liveAdvice = liveAdvice;

  return destinationObj;
};

const createDestination = async (data) => {
  const newDestination = new Destination(data);
  return await newDestination.save();
};

const updateDestination = async (id, data) => {
  return await Destination.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
};

const deleteDestination = async (id) => {
  return await Destination.findByIdAndDelete(id);
};

module.exports = {
  calculatePersonalizedScore,
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination
};