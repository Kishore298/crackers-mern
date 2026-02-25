const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserDetail,
  toggleUserStatus,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserDetail);
router.patch("/:id/toggle-status", protect, adminOnly, toggleUserStatus);

module.exports = router;
