const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    percentage: { type: Number, required: true, min: 0, max: 100 },
    label: { type: String, default: "Sale" }, // e.g. "Diwali Sale"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Discount", discountSchema);
