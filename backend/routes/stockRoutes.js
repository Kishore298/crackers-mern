const express = require("express");
const router = express.Router();
const {
  getLedger,
  getStockList,
  restockProduct,
  stockCorrection,
  restockByProductId,
  correctByProductId,
} = require("../controllers/stockController");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/stock?page=1&limit=20  — paginated ledger (what StockPage.jsx calls)
router.get("/", protect, adminOnly, getStockList);

// GET /api/stock/ledger — same but explicit
router.get("/ledger", protect, adminOnly, getLedger);

// POST /api/stock/restock  — legacy body-based
router.post("/restock", protect, adminOnly, restockProduct);

// POST /api/stock/correction — legacy body-based
router.post("/correction", protect, adminOnly, stockCorrection);

// POST /api/stock/:productId/restock  — what StockPage modal calls
router.post("/:productId/restock", protect, adminOnly, restockByProductId);

// PUT /api/stock/:productId/correct  — what StockPage modal calls
router.put("/:productId/correct", protect, adminOnly, correctByProductId);

module.exports = router;
