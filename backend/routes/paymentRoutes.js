const express = require("express");
const router  = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  placeOfflineOrder,
} = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/auth");

// ── Online payment (Razorpay checkout) ────────────────────────────
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify",       protect, verifyPayment);

// ── Offline payment (Manual GPay verification) ────────────────────
router.post("/place-offline", protect, placeOfflineOrder);

// ── Razorpay webhook (no auth – verified via HMAC signature) ──────
// Register this URL in Razorpay Dashboard → Webhooks
// Events: payment_link.paid
// router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

module.exports = router;
