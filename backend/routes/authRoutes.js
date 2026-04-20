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
router.post("/profile", protect, (req, res, next) => {
  if (req.body._method === "PUT") return updateProfile(req, res, next);
  next();
});

router.post("/address/:id", protect, (req, res, next) => {
  if (req.body._method === "PUT") return updateAddress(req, res, next);
  if (req.body._method === "DELETE") return deleteAddress(req, res, next);
  next();
});

router.post("/change-password", protect, (req, res, next) => {
  if (req.body._method === "PUT") return changePassword(req, res, next);
  next();
});

module.exports = router;
