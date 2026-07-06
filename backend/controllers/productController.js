const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Sale = require("../models/Sale");
const { cloudinary } = require("../config/cloudinary");

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Extract the 11-char YouTube video ID from various URL formats.
 * Supports:
 *   - youtube.com/watch?v=VIDEO_ID
 *   - youtube.com/shorts/VIDEO_ID
 *   - youtu.be/VIDEO_ID
 *   - Already-extracted plain video IDs
 * Returns empty string if input is invalid.
 */
const extractYouTubeId = (input) => {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Already a plain ID (11 chars, alphanumeric + _ + -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    // youtube.com/watch?v=VIDEO_ID or youtube.com/embed/VIDEO_ID
    const watchMatch = trimmed.match(/youtube\.com\/(?:watch\?.*v=|embed\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    // youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
  } catch (_) {}
  return ""; // invalid or unrecognized format
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort,
      min,
      max,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    if (min || max) {
      filter.discountedPrice = {};
      if (min) filter.discountedPrice.$gte = Number(min);
      if (max) filter.discountedPrice.$lte = Number(max);
    }

    const sortMap = {
      price_asc: { discountedPrice: 1 },
      price_desc: { discountedPrice: -1 },
      newest: { createdAt: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/admin - all including inactive (admin)
const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, isActive, sort } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (isActive !== undefined && isActive !== "") filter.isActive = isActive === "true";

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("category", "name slug");
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/id/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug",
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products (admin)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountedPrice,
      stock,
      category,
      safetyInstructions,
      youtubeId,
    } = req.body;
    if (!name || !price || !stock || !category)
      return res.status(400).json({
        success: false,
        message: "Name, price, stock, category required",
      });

    let slug = slugify(name);
    // Ensure unique slug
    let count = 0;
    while (await Product.findOne({ slug }))
      slug = `${slugify(name)}-${++count}`;

    const images = req.files
      ? req.files.map((f) => ({ url: f.path, publicId: f.filename }))
      : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      stock: Number(stock),
      category,
      images,
      video: { youtubeId: extractYouTubeId(youtubeId) },
      safetyInstructions,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const fields = [
      "name",
      "description",
      "price",
      "discountedPrice",
      "stock",
      "category",
      "safetyInstructions",
      "isActive",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });
    if (req.body.youtubeId !== undefined)
      product.video.youtubeId = extractYouTubeId(req.body.youtubeId);

    if (req.files && req.files.length > 0) {
      product.images = req.files.map((f) => ({
        url: f.path,
        publicId: f.filename,
      }));
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    for (const img of product.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    }
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/low-stock (admin)
const getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lte: threshold } }).sort({
      stock: 1,
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// PUT /api/products/:id/images/reorder (admin)
const reorderImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of { url, publicId } in desired order
    if (!Array.isArray(images))
      return res.status(400).json({ success: false, message: "images array required" });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { images } },
      { new: true },
    );
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id/images/:publicId (admin)
const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const { publicId } = req.params;
    // Remove from Cloudinary
    try { await cloudinary.uploader.destroy(publicId); } catch (e) {}

    product.images = product.images.filter((img) => img.publicId !== publicId);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  reorderImages,
  deleteProductImage,
};
