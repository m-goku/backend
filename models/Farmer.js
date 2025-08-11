const mongoose = require("mongoose");

const FarmerSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // WatermelonDB ID
      required: true,
    },
    name: String,
    nationalId: String,
    community: String,
    prefinance: Number,
    balance: Number,

    // Operational fields (all optional)
    repayment_status: {
      type: String,
    },
    total_kg_brought: {
      type: Number,
      min: 0,
    },
    total_amount: {
      type: Number,
      min: 0,
    },
    crop_type: {
      type: String,
      trim: true,
    },
    planting_date: Date,
    harvest_date: Date,
    farm_size: {
      type: String,
    },
    input_supplied: {
      type: [String],
      default: [],
    },
    farm_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      description: {
        type: String,
        trim: true,
      },
    },

    // WatermelonDB sync metadata
    _status: String,
    _changed: String,
    updated_at: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Farmer", FarmerSchema);
