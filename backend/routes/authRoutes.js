const express = require("express");
const router = express.Router();
const {
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
  sendOtpWhatsApp,
  loginWithOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp-whatsapp", sendOtpWhatsApp);
router.post("/login-otp", loginWithOtp);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/address", protect, addAddress);
router.put("/address/:id", protect, updateAddress);
router.delete("/address/:id", protect, deleteAddress);

// Password reset (OTP via email)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.put("/change-password", protect, changePassword);

// MILESWEB FALLBACKS
router.post("/profile", protect, handleMethodOverride({
  PUT: updateProfile,
}));

router.post("/address/:id", protect, handleMethodOverride({
  PUT: updateAddress,
  DELETE: deleteAddress,
}));

router.post("/change-password", protect, handleMethodOverride({
  PUT: changePassword,
}));

module.exports = router;
