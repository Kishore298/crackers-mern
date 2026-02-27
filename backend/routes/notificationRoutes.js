const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendCustomNotification,
  getSentHistory,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.post("/send", protect, adminOnly, sendCustomNotification);
router.get("/history", protect, adminOnly, getSentHistory);

module.exports = router;
