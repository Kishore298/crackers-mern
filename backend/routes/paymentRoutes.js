const express = require("express");
const router  = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  placeCODOrder,
  resendCODPaymentLink,
  razorpayWebhook,
} = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/auth");

// ── Online payment (Razorpay checkout) ────────────────────────────
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify",       protect, verifyPayment);

// ── COD order ─────────────────────────────────────────────────────
router.post("/place-cod",    protect, placeCODOrder);

// ── Admin: resend payment link for a COD order ────────────────────
router.post("/resend-payment-link/:orderId", protect, adminOnly, resendCODPaymentLink);

// ── Razorpay webhook (no auth – verified via HMAC signature) ──────
// Register this URL in Razorpay Dashboard → Webhooks
// Events: payment_link.paid
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

module.exports = router;
