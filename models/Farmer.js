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

    // Operational fields
    repayment_status: {
      type: String,
      default: "pending", // optional: helps if you need statuses
    },
    zone: {
      type: String,
      default: "",
    },
    total_kg_brought: {
      type: Number,
      min: 0,
      default: 0,
    },
    total_amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    crop_type: {
      type: String,
      trim: true,
      default: "",
    },
    planting_date: Date,
    harvest_date: Date,
    farm_size: {
      type: String,
      default: "",
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
        default: [],
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // WatermelonDB sync metadata
    _status: {
      type: String,
      enum: ["created", "updated", "deleted"],
      default: "created",
    },
    _changed: {
      type: String,
      default: "",
    },
    updated_at: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

// 🔄 Middleware to auto-update sync metadata
FarmerSchema.pre("save", function (next) {
  this.updated_at = Date.now();

  if (this.isNew) {
    this._status = "created";
  } else if (this.isModified()) {
    // only flip to "updated" if not already "deleted"
    if (this._status !== "deleted") {
      this._status = "updated";
    }
  }

  next();
});

module.exports = mongoose.model("Farmer", FarmerSchema);
