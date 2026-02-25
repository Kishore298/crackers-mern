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

// GET /api/stock?page=1&limit=20  (root — what StockPage.jsx calls)
const getStockList = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockLedger.countDocuments();
    const raw = await StockLedger.find()
      .populate("product", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Map to the field names StockPage.jsx expects
    const entries = raw.map((e) => ({
      _id: e._id,
      product: e.product,
      type: e.type,
      quantityChange: e.quantity, // StockLedger stores as `quantity`
      stockAfter: e.stockAfter ?? null,
      reference: e.note || e.reference || null, // StockLedger stores as `note`
      createdAt: e.createdAt,
      createdBy: e.createdBy,
    }));

    res.json({ success: true, entries, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/stock/:productId/restock  (product-specific, what StockPage modal calls)
const restockByProductId = async (req, res) => {
  try {
    const { quantity, reference } = req.body;
    if (!quantity)
      return res
        .status(400)
        .json({ success: false, message: "quantity required" });

    const product = await Product.findById(req.params.productId);
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
      stockAfter: product.stock,
      note: reference || "Restock",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, entry, newStock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/stock/:productId/correct  (set stock to exact new value)
const correctByProductId = async (req, res) => {
  try {
    const { newStock, reason } = req.body;
    if (newStock === undefined)
      return res
        .status(400)
        .json({ success: false, message: "newStock required" });

    const product = await Product.findById(req.params.productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const diff = Number(newStock) - product.stock;
    product.stock = Number(newStock);
    await product.save();

    const entry = await StockLedger.create({
      product: product._id,
      type: "correction",
      quantity: diff,
      stockAfter: product.stock,
      note: reason || "Manual correction",
      createdBy: req.user._id,
    });

    res.status(200).json({ success: true, entry, newStock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLedger,
  getStockList,
  restockProduct,
  stockCorrection,
  restockByProductId,
  correctByProductId,
};
