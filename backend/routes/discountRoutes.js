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

// MILESWEB FALLBACKS
router.post("/", protect, adminOnly, (req, res, next) => {
  if (req.body._method === "PUT") return setDiscount(req, res, next);
  if (req.body._method === "DELETE") return disableDiscount(req, res, next);
  next();
});

module.exports = router;
