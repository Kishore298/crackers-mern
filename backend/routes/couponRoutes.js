const express = require("express");
const router = express.Router();
const {
  getCoupons,
  getFeaturedCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");
const { protect, adminOnly } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/featured", getFeaturedCoupon); // public — homepage banner
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

// MILESWEB FALLBACKS
router.post("/:id", protect, adminOnly, handleMethodOverride({
  PUT: updateCoupon,
  DELETE: deleteCoupon,
}));
router.post("/validate", protect, validateCoupon);

module.exports = router;
