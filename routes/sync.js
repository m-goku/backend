const express = require("express");
const Farmer = require("../models/Farmer");
const router = express.Router();

// 🟢 Pull Changes
router.get("/pull", async (req, res) => {
  const lastPulledAt = parseInt(req.query.lastPulledAt || "0", 10);
  const timestamp = Date.now();

  let created = [];
  let updated = [];
  let deleted = [];

  const serialize = (doc) => {
    const { _id, _status, _changed, __v, ...rest } = doc.toObject();
    return { id: _id, ...rest };
  };

  if (lastPulledAt === 0) {
    // First-time sync: return all data as `created`
    const allFarmers = await Farmer.find({});
    created = allFarmers.map(serialize);
  } else {
    // Subsequent syncs: return only changes since lastPulledAt
    const changedFarmers = await Farmer.find({
      updated_at: { $gt: lastPulledAt },
    });

    created = changedFarmers
      .filter((f) => f._status === "created")
      .map(serialize);

    updated = changedFarmers
      .filter((f) => f._status === "updated")
      .map(serialize);

    deleted = changedFarmers
      .filter((f) => f._status === "deleted")
      .map((f) => f._id.toString());
  }

  const changes = {
    farmers: {
      created,
      updated,
      deleted,
    },
  };

  res.json({ changes, timestamp });
});

// 🔴 Push Changes (fixed)
router.post("/push", async (req, res) => {
  try {
    const { changes } = req.body;
    const farmers = changes.farmers || {};

    // Handle created & updated
    for (const farmer of [
      ...(farmers.created || []),
      ...(farmers.updated || []),
    ]) {
      const { id, ...rest } = farmer;
      await Farmer.findByIdAndUpdate(
        id,
        { ...rest, updated_at: Date.now() },
        { upsert: true, new: true }
      );
    }

    // Handle deleted
    for (const id of farmers.deleted || []) {
      await Farmer.findByIdAndDelete(id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Push error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
