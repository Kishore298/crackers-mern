const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getReports,
  getProductPerformance,
  getReport,
} = require("../controllers/analyticsController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get("/reports", protect, adminOnly, getReports);
router.get("/report", protect, adminOnly, getReport);
router.get("/product-performance", protect, adminOnly, getProductPerformance);

module.exports = router;
