// routes/farmerSync.js
const express = require("express");
const Farmer = require("../models/Farmer");
const router = express.Router();

// Helper: Serialize farmer for sync
const serialize = (doc) => {
  const { _id, _status, _changed, __v, ...rest } = doc.toObject();
  return { id: _id.toString(), ...rest };
};

// 🟢 Pull Changes
// 🟢 Pull Changes
router.get("/pull", async (req, res) => {
  const lastPulledAt = parseInt(req.query.lastPulledAt || "0", 10);
  const timestamp = Date.now();

  let created = [];
  let updated = [];
  let deleted = [];

  const serialize = (doc) => {
    if (!doc) return null;
    const { _id, _status, _changed, __v, ...rest } = doc.toObject();
    return { id: _id.toString(), ...rest };
  };

  if (lastPulledAt === 0) {
    // First-time sync: return all non-deleted as created
    const allFarmers = await Farmer.find({ _status: { $ne: "deleted" } });
    created = allFarmers.map(serialize);

    // Send deleted ones too
    const deletedFarmers = await Farmer.find({ _status: "deleted" });
    deleted = deletedFarmers.map((f) => f._id.toString());
  } else {
    // Return changes since lastPulledAt
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

  res.json({
    changes: { farmers: { created, updated, deleted } },
    timestamp,
  });
});

// 🔴 Push Changes
router.post("/push", async (req, res) => {
  const { changes } = req.body;
  const farmers = changes.farmers || {};
  const now = Date.now();

  // Handle created & updated
  for (const farmer of [
    ...(farmers.created || []),
    ...(farmers.updated || []),
  ]) {
    await Farmer.findByIdAndUpdate(
      farmer.id,
      { ...farmer, updated_at: now, _status: "updated" },
      { upsert: true }
    );
  }

  // Handle deleted (soft delete)
  for (const id of farmers.deleted || []) {
    await Farmer.findByIdAndUpdate(id, {
      _status: "deleted",
      updated_at: now,
    });
  }

  res.json({ success: true });
});

// 🧹 Cleanup Job (optional, run manually or via cron)
router.delete("/cleanup", async (req, res) => {
  const olderThan = Date.now() - 1000 * 60 * 60 * 24 * 30; // 30 days
  const result = await Farmer.deleteMany({
    _status: "deleted",
    updated_at: { $lt: olderThan },
  });
  res.json({ cleaned: result.deletedCount });
});

module.exports = router;
