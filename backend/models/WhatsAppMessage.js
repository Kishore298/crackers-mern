const mongoose = require("mongoose");

const WhatsAppMessageSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      default: "Unknown Customer",
    },
    body: {
      type: String,
    },
    messageId: {
      type: String,
      required: true,
      unique: true, // Prevents saving the same incoming message twice
    },
    type: {
      type: String,
      default: "text",
    },
    status: {
      type: String, // 'received', 'sent', 'delivered', 'read'
      default: "received",
    },
    rawPayload: {
      type: Object, // Keep the full payload for debugging or future feature extraction
    },
  },
  { timestamps: true }
);

// TTL Index: Auto-delete messages 90 days after creation (90 * 24 * 60 * 60 = 7776000 seconds)
WhatsAppMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("WhatsAppMessage", WhatsAppMessageSchema);
