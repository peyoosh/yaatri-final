const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini. Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

router.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an authentic Yaatri (Travel) guide. Respond to the user's travel-related query. Keep it helpful, concise, and related to travel. User query: "${query}"`;
    
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