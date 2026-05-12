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

const classifyDestinationType = (destination) => {
  const text = `${destination.name} ${destination.region} ${destination.description} ${destination.terrainType}`.toLowerCase();
  if (/culture|heritage|temple|tradition|spiritual|village|historical|festival/.test(text)) {
    return 'Cultural';
  }
  if (/trek|hike|summit|climb|adventure|river|rafting|trail|camp|mountain|wild/.test(text)) {
    return 'Adventure';
  }
  return 'Mixed';
};

const classifyDifficulty = (destination) => {
  const altitude = destination.altitude || 0;
  if (altitude >= 5000) return 'Extreme';
  if (altitude >= 3500) return 'Hard';
  if (altitude >= 2000) return 'Moderate';
  return 'Easy';
};

const buildPreferenceProfile = (user) => {
  const preferences = (user.preferences || '')
    .split(',')
    .map(pref => pref.trim().toLowerCase())
    .filter(Boolean);

  const historyKeywords = (user.tripHistory || [])
    .flatMap(entry => [entry.dest || '', entry.comment || ''])
    .join(' ')
    .toLowerCase();

  const preferenceKeywords = [...new Set([...preferences, ...historyKeywords.split(/\s+/)])].filter(Boolean);

  const typePreferences = [];
  if (preferences.some(pref => /culture|heritage|tradition|village|spiritual/.test(pref))) {
    typePreferences.push('Cultural');
  }
  if (preferences.some(pref => /adventure|trek|hike|summit|climb|river|rafting/.test(pref))) {
    typePreferences.push('Adventure');
  }

  return {
    keywords: preferenceKeywords,
    typePreferences: [...new Set(typePreferences)],
    historyDestinations: (user.tripHistory || []).map(entry => entry.dest).filter(Boolean),
    ratedDestinations: (user.tripHistory || []).filter(entry => Number(entry.rating) >= 4).map(entry => entry.dest)
  };
};

const scoreDestination = (destination, profile) => {
  let score = destination.popularityScore || 0;
  const text = `${destination.name} ${destination.region} ${destination.description} ${destination.terrainType}`.toLowerCase();

  profile.keywords.forEach(keyword => {
    if (keyword.length > 2 && text.includes(keyword)) {
      score += 12;
    }
  });

  const destinationType = classifyDestinationType(destination);
  if (profile.typePreferences.includes(destinationType)) {
    score += 20;
  }

  if (profile.historyDestinations.some(name => name && text.includes(name.toLowerCase()))) {
    score += 18;
  }

  if (profile.ratedDestinations.some(name => name && text.includes(name.toLowerCase()))) {
    score += 15;
  }

  score += destinationType === 'Adventure' ? 5 : 8;
  score += classifyDifficulty(destination) === 'Extreme' ? 10 : classifyDifficulty(destination) === 'Hard' ? 7 : 4;

  return score;
};

const getPersonalizedRecommendations = async (user, limit = 6) => {
  const destinations = await Destination.find().lean();
  const profile = buildPreferenceProfile(user);

  const recommendations = destinations.map(dest => {
    const processed = {
      ...dest,
      experienceType: classifyDestinationType(dest),
      difficulty: classifyDifficulty(dest)
    };

    const score = scoreDestination(processed, profile);
    const reasons = [];

    if (profile.typePreferences.includes(processed.experienceType)) {
      reasons.push(`Matches your preferred ${processed.experienceType.toLowerCase()} travel style.`);
    }
    if (profile.historyDestinations.some(name => name && processed.name.toLowerCase().includes(name.toLowerCase()))) {
      reasons.push('Similar to destinations you enjoyed before.');
    }
    if (processed.difficulty === 'Easy' && profile.keywords.includes('easy')) {
      reasons.push('Great for a relaxed, accessible trip.');
    }
    if (processed.difficulty === 'Extreme') {
      reasons.push('Ideal for high-altitude adventure seekers.');
    }

    return {
      destination: processed,
      score,
      reasons: reasons.length ? reasons : ['Strong match based on your travel profile.']
    };
  });

  recommendations.sort((a, b) => b.score - a.score);
  return {
    preferenceProfile: profile,
    recommendations: recommendations.slice(0, limit)
  };
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
  destinationObj.experienceType = classifyDestinationType(destinationObj);
  destinationObj.difficulty = classifyDifficulty(destinationObj);

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
  getPersonalizedRecommendations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination
};