const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Destination = require('../models/Destination');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[ai] GEMINI_API_KEY is not set.');
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ── Destination cache — refresh every 5 min, avoid DB hit on every message ──
let _destCache = { docs: [], expiresAt: 0 };
const getDestinations = async () => {
  if (Date.now() < _destCache.expiresAt) return _destCache.docs;
  const docs = await Destination.find()
    .select('_id name region terrainType altitude description')
    .lean();
  _destCache = { docs, expiresAt: Date.now() + 5 * 60 * 1000 };
  return docs;
};

// ── Per-IP rate limit — max 8 requests per 60 s ───────────────────────────
const _ipBuckets = new Map();
const isRateLimited = (ip) => {
  const now = Date.now();
  const bucket = _ipBuckets.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60_000; }
  bucket.count += 1;
  _ipBuckets.set(ip, bucket);
  return bucket.count > 8;
};

const ALLOWED_REDIRECTS = ['/destinations','/explore','/blog','/support','/login','/register','/dashboard','/contact'];

const buildSystemPrompt = (destinations) => {
  const destList = destinations.length
    ? destinations.map(d =>
        `  - _id="${d._id}" ${d.name} (${d.region}, ${d.terrainType || 'Hill'}${d.altitude ? `, ${d.altitude}m` : ''})`
      ).join('\n')
    : '  (no destinations yet)';

  return `You are Yaatri AI — a warm Nepal travel buddy embedded in the Yaatri booking platform. You know Nepal deeply: treks (EBC 12-14d, ABC 7-10d, Annapurna Circuit 12-20d, Langtang 7-10d, Mustang restricted $500 permit, Manaslu restricted, Rara Lake, Poon Hill 4-5d), seasons (pre-monsoon Mar-May, monsoon Jun-Sep avoid except Mustang/Dolpo, post-monsoon Sep-Nov peak, winter Dec-Feb quiet), AMS safety (max 500m gain/night above 3000m), costs (budget NPR 3000/day, mid 5000-7000, porter 2000-3000/day), food (dal bhat, momos, sel roti), festivals (Dashain Sep-Oct, Tihar Oct-Nov, Holi Mar).

Platform: Yaatri booking — base rate NPR 2500/person/day + 4% state tax + 12% GST. Add-ons: guide 1500/day, premium lodging 2000/night, transport 800, meals 600. Heart icon = save to favourites. Invoice emailed after booking. Cancel: dashboard → Trips.

Tone: warm, direct, 2-4 sentences. No "As an AI" or "I'd be happy to". No filler endings. Steer off-topic questions back to Nepal travel.

Live destinations (recommend by _id):
${destList}

redirectTo: ONLY set when user explicitly says "take me to", "go to", "open [page]". Informational questions always get null.
Allowed: /destinations /blog /support /login /register /dashboard /contact /explore (never redirect to /explore)

Output ONLY valid JSON (no markdown):
{"reply":"...","redirectTo":null,"suggestedDestinations":["_id1"]}
suggestedDestinations: 0-3 _ids from the live list above.`;
};

const sanitizeHistory = (raw) => {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .filter(m => m && (m.role === 'user' || m.role === 'model') && Array.isArray(m.parts))
    .slice(-6) // last 3 turns only — keeps tokens low
    .map(m => ({
      role: m.role,
      parts: m.parts.filter(p => typeof p.text === 'string').map(p => ({ text: p.text.slice(0, 800) })),
    }))
    .filter(m => m.parts.length > 0);

  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift();

  const alternating = [];
  for (const entry of cleaned) {
    if (!alternating.length || alternating[alternating.length - 1].role !== entry.role) {
      alternating.push(entry);
    } else {
      alternating[alternating.length - 1] = entry;
    }
  }
  return alternating;
};

router.post('/chat', async (req, res) => {
  const { query, history } = req.body || {};

  // Rate limit
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      reply: "You're sending messages too fast — give me a moment to breathe! Try again in about a minute.",
      redirectTo: null,
      suggestedDestinations: [],
    });
  }

  if (!query || !String(query).trim()) {
    return res.json({ reply: "What's on your mind? Ask me about a trek, a season, or where to go in Nepal.", redirectTo: null, suggestedDestinations: [] });
  }

  try {
    const destinations = await getDestinations();
    const chatHistory = sanitizeHistory(history);

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      history: chatHistory,
      config: {
        systemInstruction: buildSystemPrompt(destinations),
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const result = await chat.sendMessage({ message: String(query).slice(0, 2000) });
    const responseText = result.text;

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Model returned non-JSON — extract reply text if possible
      return res.json({
        reply: responseText.slice(0, 300) || "I got confused there — could you rephrase?",
        redirectTo: null,
        suggestedDestinations: [],
      });
    }

    const redirectTo = typeof parsed.redirectTo === 'string' && ALLOWED_REDIRECTS.includes(parsed.redirectTo)
      ? parsed.redirectTo : null;

    const idIndex = new Map(destinations.map(d => [String(d._id), d]));
    const suggestedDestinations = (Array.isArray(parsed.suggestedDestinations) ? parsed.suggestedDestinations : [])
      .map(id => idIndex.get(String(id))).filter(Boolean).slice(0, 3);

    const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : "Ask me about treks, seasons, or which destination fits your style.";

    res.json({ reply, redirectTo, suggestedDestinations });

  } catch (error) {
    const msg = error?.message || '';
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    const isKey   = msg.includes('API_KEY') || msg.includes('401') || msg.includes('403');

    if (isQuota) {
      return res.status(429).json({
        reply: "The guide is taking a breather — free tier limit reached. Try again in a minute.",
        redirectTo: null,
        suggestedDestinations: [],
      });
    }
    if (isKey) {
      console.error('[ai] API key error — check GEMINI_API_KEY env var');
      return res.json({
        reply: "I'm having trouble connecting right now. Please try again shortly.",
        redirectTo: null,
        suggestedDestinations: [],
      });
    }
    console.error('[ai] error:', msg.slice(0, 200));
    res.json({
      reply: "Something went wrong on my end. Try again in a moment.",
      redirectTo: null,
      suggestedDestinations: [],
    });
  }
});

module.exports = router;
