const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Destination = require('../models/Destination');
const User = require('../models/User');
const { generateInvoice } = require('../services/billingService');

router.get('/destination/:id/invoice', protect, async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id)
      .populate('assignedHotels', 'name basePrice totalRooms features')
      .populate('assignedGuides', 'username profileData');

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const user = await User.findById(req.user.id).select('username email preferences');
    const invoice = generateInvoice(destination.toObject(), user || {});

    res.json(invoice);
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

module.exports = router;
