const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    video: {
      youtubeId: { type: String, default: "" },
    },
    safetyInstructions: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isCombo: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    comboProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
  },
  { timestamps: true },
);

// Virtual: effective price
productSchema.virtual("effectivePrice").get(function () {
  if (this.isCombo && this.discountPercent > 0) {
    return Math.round(this.price * (1 - this.discountPercent / 100));
  }
  return this.discountedPrice && this.discountedPrice < this.price
    ? this.discountedPrice
    : this.price;
});

productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
