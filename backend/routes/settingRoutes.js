const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingController");
const { protect, adminOnly } = require("../middleware/auth");

// Public route to fetch settings (e.g. for checkout page)
router.get("/", getSettings);

// Admin route to update settings
router.put("/", protect, adminOnly, updateSettings);

module.exports = router;
