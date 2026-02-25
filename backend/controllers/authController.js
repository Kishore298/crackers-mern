const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail } = require("../config/emailService");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, password: hashed });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    // Accept legacy `email` field OR new `identifier` field
    const raw = (identifier || email || "").trim();
    if (!raw || !password)
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required",
      });

    // Detect whether the user typed a phone number or an email
    const isPhone = /^[\d\s\-+()]+$/.test(raw);
    const query = isPhone
      ? { phone: raw.replace(/\s/g, "") } // normalise spaces
      : { email: raw.toLowerCase() };

    const user = await User.findOne(query).select("+password");
    if (!user || !user.isActive)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/profile  (protected)
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
};

// PUT /api/auth/profile (protected)
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true },
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/address  (protected)
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { isDefault, ...addrData } = req.body;
    if (isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    user.addresses.push({ ...addrData, isDefault: !!isDefault });
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/address/:id (protected)
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    const { isDefault, ...updates } = req.body;
    if (isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    Object.assign(addr, updates, { isDefault: !!isDefault });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/address/:id (protected)
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.id,
    );
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Password Reset (OTP via Email) ─────────────────────────────────────────

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Return error if email not registered
    if (!user)
      return res.status(404).json({
        success: false,
        message: "No account found with that email address.",
      });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Store on user document
    user.otpCode = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpVerified = false;
    await user.save({ validateBeforeSave: false });

    // Send email
    await sendOtpEmail(user.email, otp);

    res.json({
      success: true,
      message: "OTP sent to your email address. Valid for 10 minutes.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+otpCode +otpExpiry +otpVerified");

    if (!user || !user.otpCode)
      return res
        .status(400)
        .json({ success: false, message: "OTP not found or already used" });

    if (user.otpExpiry < new Date())
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Request a new one.",
      });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== user.otpCode)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // Mark as verified
    user.otpVerified = true;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "OTP verified. You may now reset your password.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });

    if (password.length < 6)
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+otpCode +otpExpiry +otpVerified +password");

    if (!user || !user.otpVerified)
      return res.status(400).json({
        success: false,
        message: "OTP not verified. Please complete verification first.",
      });

    // Reset password
    user.password = await bcrypt.hash(password, 12);
    // Clear OTP fields
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    user.otpVerified = false;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/change-password (protected - for profile page)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    if (newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });

    const user = await User.findById(req.user._id).select("+password");
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};
