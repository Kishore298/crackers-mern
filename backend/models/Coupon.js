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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
