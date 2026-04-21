const express = require("express");
const router = express.Router();
const {
  getDiscount,
  setDiscount,
  disableDiscount,
} = require("../controllers/discountController");
const { protect, adminOnly } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", getDiscount); // public
router.put("/", protect, adminOnly, setDiscount); // admin — set/update
router.delete("/", protect, adminOnly, disableDiscount); // admin — disable

// MILESWEB FALLBACKS
router.post("/", protect, adminOnly, handleMethodOverride({
  PUT: setDiscount,
  DELETE: disableDiscount,
}));

module.exports = router;
