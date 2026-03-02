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
  getPopularProducts,
  reorderImages,
  deleteProductImage,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadProduct } = require("../config/cloudinary");

router.get("/", getProducts);
router.get("/popular", getPopularProducts);
router.get("/admin", protect, adminOnly, getAdminProducts);
router.get("/low-stock", protect, adminOnly, getLowStock);
router.get("/id/:id", getProductById);
router.get("/:slug", getProductBySlug);

router.post("/", protect, adminOnly, uploadProduct.array("images", 5), createProduct);
router.put("/:id", protect, adminOnly, uploadProduct.array("images", 5), updateProduct);
router.put("/:id/images/reorder", protect, adminOnly, reorderImages);
router.delete("/:id/images/:publicId", protect, adminOnly, deleteProductImage);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
