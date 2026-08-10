const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    // FCM push notification tokens
    fcmTokens: [{ type: String }],

  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
