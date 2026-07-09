const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  requestCancellation,
  adminCancelOrder,
  rejectCancellationRequest,
  resendWhatsappReceipt,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", protect, getOrders);
router.get("/admin", protect, adminOnly, getOrders);   // must be before /:id
router.get("/:id", protect, getOrderById);

// Status update (admin)
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

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
