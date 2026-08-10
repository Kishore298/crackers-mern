const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendCustomNotification,
  getSentHistory,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.delete("/all", protect, deleteAllNotifications);
router.delete("/:id", protect, deleteNotification);

// MILESWEB FALLBACKS
router.post("/read-all", protect, handleMethodOverride({
  PATCH: markAllAsRead,
}));
router.post("/all", protect, handleMethodOverride({
  DELETE: deleteAllNotifications,
}));
router.post("/:id/read", protect, handleMethodOverride({
  PATCH: markAsRead,
}));
router.post("/:id", protect, handleMethodOverride({
  DELETE: deleteNotification,
}));
router.post("/send", protect, adminOnly, sendCustomNotification);
router.get("/history", protect, adminOnly, getSentHistory);

module.exports = router;
