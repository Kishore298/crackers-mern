const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  requestCancellation,
  adminCancelOrder,
  rejectCancellationRequest,
  resendWhatsappReceipt,
  updateShippingAddress,
  getOrderPdf,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", protect, getOrders);
router.get("/admin", protect, adminOnly, getOrders);   // must be before /:id
router.get("/:id", protect, getOrderById);
router.get("/:id/pdf", protect, getOrderPdf);

// Status & Details update
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
router.put("/:id/payment-status", protect, adminOnly, updatePaymentStatus);
router.put("/:id/shipping-address", protect, updateShippingAddress);

// MILESWEB FALLBACKS
router.post("/:id/status", protect, adminOnly, handleMethodOverride({
  PUT: updateOrderStatus,
}));

// Cancellation
router.post("/:id/cancel-request", protect, requestCancellation);       // user
router.post("/:id/cancel", protect, adminOnly, adminCancelOrder);        // admin
router.post("/:id/cancel-reject", protect, adminOnly, rejectCancellationRequest); // admin

// Resend WhatsApp Receipt
router.post("/:id/resend-whatsapp", protect, adminOnly, resendWhatsappReceipt); // admin

module.exports = router;
