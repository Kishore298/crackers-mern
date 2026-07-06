const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  getCategoriesWithProducts,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, adminOnly } = require("../middleware/auth");
const { uploadCategory } = require("../config/cloudinary");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", getCategories);
router.get("/with-products", getCategoriesWithProducts);
router.get("/:id", getCategoryById);

router.post(
  "/",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  createCategory
);

// KEEP ORIGINAL PUT (important)
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  updateCategory
);

// MILESWEB FALLBACK (Systematic version)
router.post(
  "/:id",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  handleMethodOverride({
    PUT: updateCategory,
    DELETE: deleteCategory,
  })
);

router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;