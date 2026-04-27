const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Destination = require('../models/Destination');

// Initialize Gemini. Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

router.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  try {
    // 1. Fetch real destination data from MongoDB to give the AI context
    const destinations = await Destination.find().select('name region terrainType description').limit(15);
    const dbContext = destinations.map(d => `- ${d.name} (${d.region} - ${d.terrainType} terrain): ${d.description}`).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // 2. Build a prompt that forces the AI to use your database contents
    const prompt = `You are an authentic Yaatri (Travel) guide. Respond to the user's travel-related query. 
    Use the following real destinations from our database to help answer the user if relevant:
    ${dbContext || 'No specific destinations currently in the database.'}
    
    Keep it helpful, concise, and related to travel.
    User query: "${query}"`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    res.json({ reply: responseText });
  } catch (error) {
    console.error("AI Generation Error:", error);
    // Fallback response if API fails
    res.json({ reply: `As a Yaatri guide, I've analyzed your interest in "${query}". For the most authentic experience, I suggest visiting during the local festival season.` });
  }
});

module.exports = router;