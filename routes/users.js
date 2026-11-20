const express = require("express");
const { getDB } = require("../config/db");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// PATCH /api/users/profile  -> shudhu nijer profile update
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const phone = (req.body.phone || "").trim();
    const area = (req.body.area || "").trim();
    const bio = (req.body.bio || "").trim();
    const image = (req.body.image || "").trim();

    if (!name) return res.status(400).send({ message: "Name is required" });
    if (bio.length > 500) {
      return res.status(400).send({ message: "Bio must be 500 characters or less" });
    }

    // email ar role kokhono ekhan theke change hobe na
    const set = { name, phone, area, bio, updatedAt: new Date() };
    if (image) set.image = image;

    const db = await getDB();
    const result = await db
      .collection("user")
      .updateOne({ email: req.user.email }, { $set: set });

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send({ message: "Profile updated" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update profile" });
  }
});

module.exports = router;