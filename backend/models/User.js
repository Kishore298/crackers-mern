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
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: { type: String, required: true, select: false },
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    // OTP fields for password reset
    otpCode: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false, select: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
