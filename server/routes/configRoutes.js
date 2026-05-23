const express = require('express');
const router = express.Router();

// Public endpoint — the Google Maps JavaScript API runs in the browser so the
// key has to reach the client anyway. Real protection lives in the Google
// Cloud Console (HTTP-referrer restrictions for the JS API, IP restrictions
// for any server-side Maps calls).
router.get('/maps-key', (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    return res.sendError(503, 'MAPS_KEY_UNCONFIGURED', 'Google Maps API key is not configured on the server.');
  }
  res.json({ key });
});

module.exports = router;
