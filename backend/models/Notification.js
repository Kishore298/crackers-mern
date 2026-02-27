const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // null = broadcast to all of recipientRole
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipientRole: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["order", "promo", "custom"],
      default: "custom",
    },
    imageUrl: { type: String, default: "" },
    actionUrl: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// Index for fast queries
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
