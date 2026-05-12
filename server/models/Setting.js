const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  marqueeTitle: {
    type: String,
    default: "DISCOVER NEPAL'S HIDDEN TREASURES - FROM EVEREST TO TERAI"
  }
});

module.exports = mongoose.model('Setting', settingSchema);