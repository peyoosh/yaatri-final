const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Destination = require('../models/Destination');

// Initialize Gemini. Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ');
const extractDestinationMatches = (text, destinations) => {
  const normalized = normalizeText(text);
  const found = [];

  destinations.forEach(dest => {
    const normalizedName = normalizeText(dest.name).trim().replace(/\s+/g, '\\s+');
    const regex = new RegExp(`\\b${normalizedName}\\b`, 'i');
    if (regex.test(normalized)) {
      found.push(dest);
    }
  });

  return found;
};

router.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  try {
    // 1. Fetch real destination data from MongoDB to give the AI context
    const destinations = await Destination.find().select('_id name region terrainType altitude description');
    
    const destinationDocs = destinations.map(d => ({
      _id: d._id,
      name: d.name,
      region: d.region,
      terrainType: d.terrainType,
      altitude: d.altitude,
      description: d.description
    }));

    const schemaContext = `Destination collection schema fields:
- name: String
- region: String
- description: String
- imageURL: String
- terrainType: Himalayan | Hill | Terai
- popularityScore: Number
- altitude: Number
- environmentalTips: { isViewPoint, isNaturalWaterBody }
- experienceProtocols: { adventure, tradition, landscape, tours }
`;

    const dbContext = destinationDocs.map(d => {
      return `- ${d.name} (Region: ${d.region}, Terrain: ${d.terrainType}, Altitude: ${d.altitude || 'N/A'}m) - ${d.description}`;
    }).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an authentic Yaatri (Travel) guide for Nepal. Based on the user's preferences, recommend specific destinations from this list:

${schemaContext}
${dbContext || 'No destinations available.'}

When recommending destinations:
1. ALWAYS mention specific destination names from the list above.
2. Explain WHY each destination matches their preference.
3. Keep recommendations concise and practical.
4. If no destinations match exactly, provide general Nepal travel advice and mention the most relevant destination names.

User preference: "${query}"

Format your response by clearly stating destination names in uppercase when recommending them, e.g., "I recommend POKHARA because..."`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const suggestedDestinations = extractDestinationMatches(responseText, destinationDocs);

    res.json({ 
      reply: responseText,
      suggestedDestinations: suggestedDestinations
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    // Fallback response if API fails
    res.json({ 
      reply: `I'm your Yaatri guide! Based on your interest in "${query}", I'd recommend exploring our destination collection. Each destination offers unique experiences - from high-altitude treks to cultural valleys. Try asking about specific terrain types like "mountains", "temples", or "nature".`,
      suggestedDestinations: []
    });
  }
});

module.exports = router;