const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
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
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: { type: String, select: false, default: null },
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
