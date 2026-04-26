const express = require('express');
const router = express.Router();

// In-memory storage for the marquee title
let marqueeTitle = "SYNCING_ATMOSPHERE... REAL-TIME TERRAIN ANALYSIS ACTIVE";

router.get('/', (req, res) => {
  res.json({ marqueeTitle });
});

router.post('/', (req, res) => {
  if (req.body.marqueeTitle) marqueeTitle = req.body.marqueeTitle;
  res.json({ success: true, marqueeTitle });
});

module.exports = router;