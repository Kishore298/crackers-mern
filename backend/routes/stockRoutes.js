const express = require("express");
const router = express.Router();
const {
  getLedger,
  restockProduct,
  stockCorrection,
} = require("../controllers/stockController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/ledger", protect, adminOnly, getLedger);
router.post("/restock", protect, adminOnly, restockProduct);
router.post("/correction", protect, adminOnly, stockCorrection);

module.exports = router;
