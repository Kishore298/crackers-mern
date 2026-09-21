const express = require("express");
const router = express.Router();
const {
  getCart,
  syncCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");
const { handleMethodOverride } = require("../middleware/methodOverride");

// GET /api/users/cart
router.get("/", protect, getCart);

// POST /api/users/cart/sync
router.post("/sync", protect, syncCart);

// POST /api/users/cart/items
router.post("/items", protect, addToCart);

// PATCH /api/users/cart/items/:productId
router.patch("/items/:productId", protect, updateCartItem);

// DELETE /api/users/cart/items/:productId
router.delete("/items/:productId", protect, removeFromCart);

// DELETE /api/users/cart
router.delete("/", protect, clearCart);

// MILESWEB FALLBACKS
router.post("/items/:productId", protect, handleMethodOverride({
  PATCH: updateCartItem,
  DELETE: removeFromCart,
}));
router.post("/clear", protect, handleMethodOverride({
  DELETE: clearCart, // If using POST to /clear as a fallback for DELETE /
}));

module.exports = router;
