const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

// GET all items
router.get('/', async (req, res) => {
  const data = await Destination.find();
  res.json(data);
});

// POST new item (Admin)
router.post('/', async (req, res) => {
  const newItem = new Destination(req.body);
  await newItem.save();
  res.json(newItem);
});

module.exports = router;