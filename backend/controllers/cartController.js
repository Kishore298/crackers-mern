const User = require("../models/User");
const Product = require("../models/Product");

// Helper to format the cart: filter out deleted products and flatten the structure for the frontend
const getFormattedCart = (user) => {
  const validItems = user.cart.filter((item) => item.product != null && item.product.isActive !== false);
  return validItems.map((item) => ({
    ...item.product.toObject(),
    quantity: item.quantity,
  }));
};

// GET /api/users/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Clean up DB if any products were deleted or made inactive
    const originalLength = user.cart.length;
    user.cart = user.cart.filter((item) => item.product != null && item.product.isActive !== false);
    
    if (user.cart.length !== originalLength) {
      await user.save();
    }

    res.json({ success: true, cart: getFormattedCart(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/cart/sync
// Body: { items: [{ _id: "product_id", quantity: 2 }] }
const syncCart = async (req, res) => {
  try {
    const { items = [] } = req.body;
    const user = await User.findById(req.user._id).populate("cart.product");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Clean up DB first
    user.cart = user.cart.filter((item) => item.product != null && item.product.isActive !== false);

    // Create a map of existing DB cart items
    const cartMap = new Map();
    user.cart.forEach((item) => {
      cartMap.set(item.product._id.toString(), item);
    });

    // Fetch all incoming products to validate them
    const incomingProductIds = items.map((i) => i._id).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: incomingProductIds }, isActive: true });
    
    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p._id.toString(), p));

    // Merge incoming guest items
    for (const incomingItem of items) {
      if (!incomingItem._id || incomingItem.quantity < 1) continue;
      const pid = incomingItem._id.toString();
      
      const product = productMap.get(pid);
      if (!product) continue; // Invalid, inactive, or deleted

      if (cartMap.has(pid)) {
        // Exists in DB, add quantities but cap by stock
        const existing = cartMap.get(pid);
        existing.quantity = Math.min(existing.quantity + incomingItem.quantity, product.stock);
      } else {
        // New item from guest cart
        const cappedQty = Math.min(incomingItem.quantity, product.stock);
        if (cappedQty > 0) {
          user.cart.push({ product: pid, quantity: cappedQty });
          cartMap.set(pid, user.cart[user.cart.length - 1]);
        }
      }
    }

    await user.save();
    
    // Populate again to get full product details for the newly added items
    await user.populate("cart.product");

    res.json({ success: true, cart: getFormattedCart(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/cart/items
// Body: { productId, quantity }
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: "Product unavailable" });
    }

    const user = await User.findById(req.user._id);

    const existingIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    let newQty = quantity;
    if (existingIndex > -1) {
      newQty += user.cart[existingIndex].quantity;
    }

    if (newQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} available` });
    }

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity = newQty;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/cart/items/:productId
// Body: { quantity }
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: "Product unavailable" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} available` });
    }

    const user = await User.findById(req.user._id);

    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity = quantity;
      await user.save();
    } else {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/cart/items/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/cart
// Optional Body: { productIds: ["id1", "id2"] }
// If productIds is provided, clears only those. Otherwise, clears the whole cart.
const clearCart = async (req, res) => {
  try {
    const { productIds } = req.body;
    const user = await User.findById(req.user._id);

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      user.cart = user.cart.filter(
        (item) => !productIds.includes(item.product.toString())
      );
    } else {
      user.cart = []; // Clear all
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCart,
  syncCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
