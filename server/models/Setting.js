const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  marqueeTitle: {
    type: String,
    default: "SYNCING_ATMOSPHERE... REAL-TIME ANALYSIS"
  }
});

module.exports = mongoose.model('Setting', settingSchema);