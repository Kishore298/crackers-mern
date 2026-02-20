const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getReports,
} = require("../controllers/analyticsController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get("/reports", protect, adminOnly, getReports);

module.exports = router;
