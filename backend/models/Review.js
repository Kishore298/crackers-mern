const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true },
    source: {
      type: String,
      enum: ["website", "google"],
      default: "website",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    googleReviewId: { type: String, default: null },
  },
  { timestamps: true }
);

// Only one website review per customer
reviewSchema.index(
  { customer: 1, source: 1 },
  {
    unique: true,
    partialFilterExpression: {
      customer: { $type: "objectId" },
      source: "website",
    },
  }
);

module.exports = mongoose.model("Review", reviewSchema);
