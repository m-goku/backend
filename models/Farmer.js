const mongoose = require("mongoose");

const FarmerSchema = new mongoose.Schema({
  _id: String, // use WatermelonDB ID
  name: String,
  nationalId: String,
  community: String,
  prefinance: Number,
  balance: Number,
  _status: String,
  _changed: String,
  updated_at: Number,
});

module.exports = mongoose.model("Farmer", FarmerSchema);
