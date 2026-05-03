const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const { validateAdmin } = require('../middleware/authMiddleware');

// --- PUBLIC: FETCH ALL NODES ---
router.get('/', async (req, res) => {
  try {
    const allDestinations = await Destination.find().sort({ popularityScore: -1 }).lean();
    res.status(200).json(allDestinations);
  } catch (err) {
    res.status(500).json({ error: "DATA_STREAM_FAILURE" });
  }
});

// --- ADMIN: STORE NEW NODE ---
router.post('/', validateAdmin, async (req, res) => {
  try {
    const newDest = new Destination(req.body);
    const savedDest = await newDest.save();
    res.status(201).json(savedDest);
  } catch (err) {
    res.status(400).json({ error: "NODE_STORAGE_FAILED" });
  }
});

// --- ADMIN: PURGE NODE ---
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    await Destination.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "NODE_PURGED" });
  } catch (err) {
    res.status(400).json({ error: "PURGE_FAILED" });
  }
});

module.exports = router;