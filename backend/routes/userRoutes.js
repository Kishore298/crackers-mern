const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserDetail,
  toggleUserStatus,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");

// Customer lookup for POS auto-fetch (must be before /:id)
router.get("/lookup", protect, adminOnly, async (req, res) => {
  try {
    const { phone, email } = req.query;
    if (!phone && !email)
      return res.status(400).json({ success: false, message: "phone or email required" });

    const filter = { role: "customer" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    else if (email) filter.email = { $regex: email, $options: "i" };

    const users = await User.find(filter)
      .select("name email phone")
      .limit(8)
      .lean();

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserDetail);
router.patch("/:id/toggle-status", protect, adminOnly, toggleUserStatus);

module.exports = router;
