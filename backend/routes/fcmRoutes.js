const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// POST /api/fcm/register — save FCM token for push notifications
router.post("/register", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "FCM token required" });

    // Add token if not already stored
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: token },
    });

    res.json({ success: true, message: "FCM token registered" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
