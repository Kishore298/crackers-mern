const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../config/socket");
const { sendPushToTokens } = require("../config/firebase");

/**
 * GET /api/notifications
 * Fetch notifications for logged-in user (paginated)
 */
const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const role = req.user.role === "admin" ? "admin" : "customer";

    const query = {
      recipientRole: role,
      $or: [{ recipient: userId }, { recipient: null }],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Mark broadcast read status per user
    const enriched = notifications.map((n) => ({
      ...n,
      isRead: n.recipient
        ? n.isRead
        : (n.readBy || []).some((id) => id.toString() === userId.toString()),
    }));

    const total = await Notification.countDocuments(query);

    res.json({ success: true, notifications: enriched, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role === "admin" ? "admin" : "customer";

    // Count targeted unread
    const targetedCount = await Notification.countDocuments({
      recipientRole: role,
      recipient: userId,
      isRead: false,
    });

    // Count broadcast unread (not in readBy)
    const broadcastCount = await Notification.countDocuments({
      recipientRole: role,
      recipient: null,
      readBy: { $ne: userId },
    });

    res.json({ success: true, count: targetedCount + broadcastCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    if (notification.recipient) {
      // Targeted notification
      notification.isRead = true;
      await notification.save();
    } else {
      // Broadcast — add to readBy
      await Notification.findByIdAndUpdate(req.params.id, {
        $addToSet: { readBy: req.user._id },
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role === "admin" ? "admin" : "customer";

    // Mark targeted as read
    await Notification.updateMany(
      { recipientRole: role, recipient: userId, isRead: false },
      { isRead: true },
    );

    // Add to readBy for broadcast
    await Notification.updateMany(
      { recipientRole: role, recipient: null, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/notifications/send  (admin only)
 * Send custom notification to all customers
 */
const sendCustomNotification = async (req, res) => {
  try {
    const { title, body, imageUrl, actionUrl } = req.body;

    if (!title || !body)
      return res
        .status(400)
        .json({ success: false, message: "Title and body required" });

    // 1) Save to DB (broadcast to all customers)
    const notification = await Notification.create({
      recipient: null,
      recipientRole: "customer",
      title,
      body,
      type: "custom",
      imageUrl: imageUrl || "",
      actionUrl: actionUrl || "",
      data: { sentBy: req.user._id },
    });

    // 2) Emit via Socket.IO to all connected customers
    try {
      const io = getIO();
      io.to("customers").emit("notification", {
        _id: notification._id,
        title,
        body,
        type: "custom",
        imageUrl,
        actionUrl,
        createdAt: notification.createdAt,
      });
    } catch (e) {
      console.error("Socket emit error:", e.message);
    }

    // 3) Send Firebase push to all customers with FCM tokens
    const usersWithTokens = await User.find({
      role: "customer",
      fcmTokens: { $exists: true, $ne: [] },
    }).select("fcmTokens");

    const allTokens = usersWithTokens.flatMap((u) => u.fcmTokens);

    if (allTokens.length > 0) {
      const { invalidTokens } = await sendPushToTokens(
        allTokens,
        title,
        body,
        { actionUrl: actionUrl || "/" },
        imageUrl,
      );

      // Clean up invalid tokens
      if (invalidTokens?.length > 0) {
        await User.updateMany(
          { fcmTokens: { $in: invalidTokens } },
          { $pullAll: { fcmTokens: invalidTokens } },
        );
      }
    }

    res.status(201).json({
      success: true,
      notification,
      pushSent: allTokens.length,
      message: "Notification sent successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/history  (admin only)
 * Get sent notification history
 */
const getSentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      recipientRole: "customer",
      recipient: null,
      type: { $in: ["custom", "promo"] },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments({
      recipientRole: "customer",
      recipient: null,
      type: { $in: ["custom", "promo"] },
    });

    res.json({ success: true, notifications, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendCustomNotification,
  getSentHistory,
};
