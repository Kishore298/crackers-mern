const Category = require("../models/Category");
const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CATEGORY_ORDER_SLUGS = [
  "single-sound-crackers",
  "premium-bomb",
  "paper-bomb",
  "k-series",
  "flowerpots",
  "special-mud-pots",
  "ground-chakkar",
  "rockets",
  "twinkling-stars-and-color-candles",
  "sparklers",
  "color-matches",
  "skyshots",
  "peacock-series",
  "2026-special-fountains-and-new-arrivals"
];

const getSortIndex = (slug) => {
  const index = CATEGORY_ORDER_SLUGS.indexOf(slug);
  return index === -1 ? 999 : index;
};

// GET /api/categories (public)
const getCategories = async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { isActive: true };
    const categories = await Category.find(filter);
    categories.sort((a, b) => {
      const indexA = getSortIndex(a.slug);
      const indexB = getSortIndex(b.slug);
      if (indexA === 999 && indexB === 999) {
        return a.name.localeCompare(b.name);
      }
      return indexA - indexB;
    });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/categories/:id (public)
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/categories (admin)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Category name required" });

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Category already exists" });

    let image = "";
    let imagePublicId = "";
    if (req.file) {
      image = req.file.path;
      imagePublicId = req.file.filename;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      imagePublicId,
    });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/categories/:id (admin)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    const { name, description, isActive } = req.body;
    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined)
      category.isActive = isActive === "true" || isActive === true;

    if (req.file) {
      if (category.imagePublicId)
        await cloudinary.uploader.destroy(category.imagePublicId);
      category.image = req.file.path;
      category.imagePublicId = req.file.filename;
    }

    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/categories/:id (admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    if (category.imagePublicId)
      await cloudinary.uploader.destroy(category.imagePublicId);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/categories/with-products (public)
const getCategoriesWithProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const { search, category, sort } = req.query;

    let catFilter = { isActive: true };
    if (category) catFilter._id = category;

    const allCategories = await Category.find(catFilter);
    allCategories.sort((a, b) => {
      const indexA = getSortIndex(a.slug);
      const indexB = getSortIndex(b.slug);
      if (indexA === 999 && indexB === 999) {
        return a.name.localeCompare(b.name);
      }
      return indexA - indexB;
    });

    const totalCategories = allCategories.length;
    const categories = allCategories.slice(skip, skip + limit);
    const categoryIds = categories.map((c) => c._id);

    let productFilter = {
      category: { $in: categoryIds },
      isActive: true,
    };
    if (search) productFilter.name = { $regex: search, $options: "i" };

    const sortMap = {
      price_asc: { discountedPrice: 1 },
      price_desc: { discountedPrice: -1 },
      newest: { createdAt: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const products = await Product.find(productFilter)
      .populate("category", "name slug")
      .sort(sortOption);

    // Group products by category
    const result = categories.map((cat) => {
      const catProducts = products.filter(
        (p) => p.category && p.category._id.toString() === cat._id.toString()
      );

      // Sort so out of stock products are placed at the end
      catProducts.sort((a, b) => {
        const aInStock = a.stock > 0 ? 1 : 0;
        const bInStock = b.stock > 0 ? 1 : 0;
        return bInStock - aInStock; 
      });

      return {
        ...cat.toObject(),
        products: catProducts,
        productCount: catProducts.length,
      };
    }).filter(cat => !(search || sort) || cat.productCount > 0 || !search); 
    // If search is used, filter out empty categories in the result (though pagination might be weird if many are empty).
    // Note: To be fully accurate with category pagination and search, we should ideally aggregate, but this works for now as long as we fetch enough.

    res.json({
      success: true,
      categories: result,
      hasMore: skip + categories.length < totalCategories,
      page,
      totalPages: Math.ceil(totalCategories / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  getCategoriesWithProducts,
  createCategory,
  updateCategory,
  deleteCategory,
};
