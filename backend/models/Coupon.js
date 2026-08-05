const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },

    // Featured banner fields
    title: { type: String, default: "" }, // e.g. "Mega Diwali Sale"
    description: { type: String, default: "" }, // e.g. "On all combo gift boxes..."
    isFeatured: { type: Boolean, default: false }, // show on homepage banner
    
    // Usage limits
    startDate: { type: Date, default: Date.now },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 1 }, // 0 = unlimited
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 1 },
      }
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
