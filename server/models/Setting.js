const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  marqueeTitle: {
    type: String,
    default: "SYNCING_ATMOSPHERE... REAL-TIME TERRAIN ANALYSIS ACTIVE"
  }
});

module.exports = mongoose.model('Setting', settingSchema);