const StockLedger = require("../models/StockLedger");
const Product = require("../models/Product");

// GET /api/stock/ledger (admin)
const getLedger = async (req, res) => {
  try {
    const { product, type, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockLedger.countDocuments(filter);
    const ledger = await StockLedger.find(filter)
      .populate("product", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, ledger, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/stock/restock (admin)
const restockProduct = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    if (!productId || !quantity)
      return res
        .status(400)
        .json({ success: false, message: "productId and quantity required" });

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    product.stock += Number(quantity);
    await product.save();

    const entry = await StockLedger.create({
      product: product._id,
      type: "restock",
      quantity: Number(quantity),
      note: note || "Restock",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, entry, newStock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/stock/correction (admin)
const stockCorrection = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    if (!productId || quantity === undefined)
      return res
        .status(400)
        .json({ success: false, message: "productId and quantity required" });

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    product.stock += Number(quantity); // can be negative for corrections
    if (product.stock < 0) product.stock = 0;
    await product.save();

    const entry = await StockLedger.create({
      product: product._id,
      type: "correction",
      quantity: Number(quantity),
      note: note || "Manual correction",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, entry, newStock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLedger, restockProduct, stockCorrection };
