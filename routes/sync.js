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
    return { id: _id.toString(), ...rest };
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

// 🔴 Push Changes (unchanged)
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
      {
        ...farmer,
        _id: farmer.id,
        updated_at: now,
      },
      { upsert: true }
    );
  }

  // Handle deleted
  for (const id of farmers.deleted || []) {
    await Farmer.findByIdAndDelete(id);
  }

  res.json({ success: true });
});

module.exports = router;
