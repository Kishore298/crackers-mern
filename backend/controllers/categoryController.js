const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// GET /api/categories (public)
const getCategories = async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });
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

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
