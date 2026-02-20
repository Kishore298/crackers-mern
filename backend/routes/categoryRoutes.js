const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadCategory } = require("../config/cloudinary");

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post(
  "/",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  createCategory,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  updateCategory,
);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
