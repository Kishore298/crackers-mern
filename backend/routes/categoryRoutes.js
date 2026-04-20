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

// ADDED THIS (fallback for MilesWeb tunneling)
router.post(
  "/:id",
  protect,
  adminOnly,
  uploadCategory.single("image"),
  (req, res, next) => {
    if (req.body._method === "PUT") {
      return updateCategory(req, res, next);
    }
    if (req.body._method === "DELETE") {
      return deleteCategory(req, res, next);
    }
    next();
  }
);

router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;