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
  },
  { timestamps: true },
);

// Virtual: effective price
productSchema.virtual("effectivePrice").get(function () {
  return this.discountedPrice && this.discountedPrice < this.price
    ? this.discountedPrice
    : this.price;
});

productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
