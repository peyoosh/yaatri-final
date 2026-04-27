const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middleware/authMiddleware');
const Setting = require('../models/Setting');

router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ marqueeTitle: settings.marqueeTitle });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.post('/', validateAdmin, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    if (req.body.marqueeTitle) settings.marqueeTitle = req.body.marqueeTitle;
    await settings.save();
    res.json({ success: true, marqueeTitle: settings.marqueeTitle });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;