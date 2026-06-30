const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

console.log(`[ai] using Ollama @ ${OLLAMA_URL} — model: ${OLLAMA_MODEL}`);

// ── Destination cache — refresh every 5 min ───────────────────────────────
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

IMPORTANT: Output ONLY valid JSON, no markdown, no explanation, no code fences. Exactly this shape:
{"reply":"...","redirectTo":null,"suggestedDestinations":["_id1"]}
suggestedDestinations: 0-3 _ids from the live list above, or empty array.`;
};

// Convert Gemini-style history → Ollama messages array
const buildMessages = (systemPrompt, history, query) => {
  const messages = [{ role: 'system', content: systemPrompt }];
  if (Array.isArray(history)) {
    for (const m of history) {
      if (!m || !Array.isArray(m.parts)) continue;
      const role = m.role === 'model' ? 'assistant' : 'user';
      const content = m.parts.map(p => p.text || '').join('').slice(0, 800);
      if (content) messages.push({ role, content });
    }
  }
  messages.push({ role: 'user', content: String(query).slice(0, 2000) });
  return messages;
};

// Extract the first valid JSON object from a string — handles accidental markdown wrappers
const extractJSON = (text) => {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
};

router.post('/chat', async (req, res) => {
  const { query, history } = req.body || {};

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
    const messages = buildMessages(buildSystemPrompt(destinations), history, query);

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        format: 'json',
        stream: false,
        options: { temperature: 0.7, num_predict: 600 },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => '');
      throw new Error(`Ollama ${ollamaRes.status}: ${errText.slice(0, 200)}`);
    }

    const ollamaData = await ollamaRes.json();
    const responseText = ollamaData.message?.content || '';

    const parsed = extractJSON(responseText);
    if (!parsed) {
      return res.json({
        reply: responseText.slice(0, 400) || "I got confused — could you rephrase that?",
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
    const isDown = msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('connect');

    if (isDown) {
      console.error('[ai] Ollama not reachable — is it running?');
      return res.json({
        reply: "The local AI guide is offline right now. Make sure Ollama is running (`ollama serve`) and try again.",
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
