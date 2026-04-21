const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  cost: { type: String, required: true },
  time: { type: String, required: true },
  image: { type: String, required: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
