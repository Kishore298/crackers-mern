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
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadProduct } = require("../config/cloudinary");

router.get("/", getProducts);
router.get("/popular", getPopularProducts); // public — top 25 by sales
router.get("/admin", protect, adminOnly, getAdminProducts);
router.get("/low-stock", protect, adminOnly, getLowStock);
router.get("/id/:id", getProductById);
router.get("/:slug", getProductBySlug);

router.post(
  "/",
  protect,
  adminOnly,
  uploadProduct.array("images", 5),
  createProduct,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadProduct.array("images", 5),
  updateProduct,
);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
