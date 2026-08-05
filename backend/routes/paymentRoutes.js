const express = require("express");
const router  = express.Router();
const {
  placeOfflineOrder,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// ── Offline payment (Manual GPay verification) ────────────────────
router.post("/place-offline", protect, placeOfflineOrder);

module.exports = router;
