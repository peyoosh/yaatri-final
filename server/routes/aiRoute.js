const express = require('express');
const router = express.Router();

router.post('/chat', (req, res) => {
  const { query } = req.body;
  
  // Logic to simulate an "Authentic Guide"
  const response = {
    reply: `As a Yaatri guide, I've analyzed your interest in "${query}". For the most authentic experience, I suggest visiting during the local festival season.`
  };
  
  res.json(response);
});

module.exports = router;