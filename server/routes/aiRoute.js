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

  const safeFallback = (reason) => ({
    reply: `I'm your Yaatri guide! Based on your interest in "${query || 'travel'}", I'd recommend exploring our destination collection. Try asking about specific regions, cultural spots, or adventure trails.`,
    redirectTo: null,
    suggestedDestinations: [],
    _fallback: reason || undefined,
  });

  try {
    // 1. Fetch real destination data so the AI can ground recommendations in actual records
    const destinations = await Destination.find().select('_id name region terrainType altitude description');

    const destinationDocs = destinations.map(d => ({
      _id: d._id,
      name: d.name,
      region: d.region,
      terrainType: d.terrainType,
      altitude: d.altitude,
      description: d.description
    }));

    const dbContext = destinationDocs.map(d => {
      return `- ${d.name} (Region: ${d.region}, Terrain: ${d.terrainType}, Altitude: ${d.altitude || 'N/A'}m) - ${d.description}`;
    }).join('\n');

    // 2. Configure Gemini to emit JSON-only (no markdown fence, no prose outside the object)
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const systemPrompt = `You are the Yaatri AI Guide for a Nepal travel platform. You ALWAYS respond as a single valid JSON object, with NO markdown code fences and NO text outside the JSON.

Required JSON shape:
{
  "reply": "<short conversational acknowledgement of the user's need>",
  "redirectTo": "</target-route-string-or-null>"
}

Intent → redirectTo rules (apply the FIRST rule that matches):
- The user wants to browse spots, locations, destinations, or places to travel → "/destinations"
- The user wants stories, articles, journals, or travel experiences → "/blog"
- The user wants account access, login, signup, or admin credentials → "/login"
- The user wants scheduling, itineraries, planning, or pathfinding tools → "/blog"
- General greeting, small talk, or unclear intent → null

Rules:
- "reply" must be 1–2 short sentences, friendly, and confirm what you are about to do (e.g., "Sure, let me take you to our destination catalogue.").
- "redirectTo" is either one of the four paths above or the JSON literal null. Never invent other paths.
- If the user names a real destination from the list below, you MAY mention it in "reply", but still redirect using the rules.

Known destinations (for grounding only — do NOT redirect to a destination URL):
${dbContext || '(none currently in the database)'}
`;

    const userPrompt = `User message: """${query || ''}"""\n\nRespond with the JSON object now.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);
    const responseText = result.response.text();

    // 3. Safe JSON.parse with fallback so a malformed LLM response never crashes the route
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('AI returned non-JSON, using fallback:', parseErr.message, '— raw:', responseText?.slice(0, 200));
      return res.json(safeFallback('invalid_json_from_model'));
    }

    // Whitelist redirectTo to the four allowed paths or null (defence-in-depth against prompt injection)
    const ALLOWED_REDIRECTS = ['/destinations', '/blog', '/login'];
    const redirectTo =
      typeof parsed.redirectTo === 'string' && ALLOWED_REDIRECTS.includes(parsed.redirectTo)
        ? parsed.redirectTo
        : null;

    const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : "I'm here to help — try asking about destinations, stories, or planning your trip.";

    // Keep the legacy `suggestedDestinations` so existing UI cards still render where relevant
    const suggestedDestinations = extractDestinationMatches(reply, destinationDocs);

    res.json({ reply, redirectTo, suggestedDestinations });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.json(safeFallback('model_or_network_error'));
  }
});

module.exports = router;