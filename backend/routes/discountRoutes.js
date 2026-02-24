const express = require("express");
const router = express.Router();
const {
  getDiscount,
  setDiscount,
  disableDiscount,
} = require("../controllers/discountController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getDiscount); // public
router.put("/", protect, adminOnly, setDiscount); // admin — set/update
router.delete("/", protect, adminOnly, disableDiscount); // admin — disable

module.exports = router;
