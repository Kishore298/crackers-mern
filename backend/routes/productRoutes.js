const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadProduct } = require("../config/cloudinary");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", getProducts);
router.get("/admin", protect, adminOnly, getAdminProducts);
router.get("/low-stock", protect, adminOnly, getLowStock);
router.get("/id/:id", getProductById);
router.get("/:slug", getProductBySlug);

router.post("/", protect, adminOnly, uploadProduct.array("images", 5), createProduct);

// ORIGINAL ROUTES
router.put("/:id", protect, adminOnly, uploadProduct.array("images", 5), updateProduct);
router.put("/:id/images/reorder", protect, adminOnly, reorderImages);
router.delete("/:id/images/:publicId", protect, adminOnly, deleteProductImage);
router.delete("/:id", protect, adminOnly, deleteProduct);

// MILESWEB FALLBACKS
router.post("/:id", protect, adminOnly, uploadProduct.array("images", 5), handleMethodOverride({
  PUT: updateProduct,
  DELETE: deleteProduct,
}));

router.post("/:id/images/reorder", protect, adminOnly, handleMethodOverride({
  PUT: reorderImages,
}));

router.post("/:id/images/:publicId", protect, adminOnly, handleMethodOverride({
  DELETE: deleteProductImage,
}));

module.exports = router;
