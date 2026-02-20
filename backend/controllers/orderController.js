const Sale = require("../models/Sale");

// GET /api/orders (admin - all; user - own orders)
const getOrders = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Customers see only their orders
    if (req.user.role !== "admin") filter.customer = req.user._id;
    if (status) filter.orderStatus = status;
    if (type) filter.saleType = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Sale.countDocuments(filter);
    const orders = await Sale.find(filter)
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id  (admin or order owner)
const getOrderById = async (req, res) => {
  try {
    const order = await Sale.findById(req.params.id).populate(
      "customer",
      "name email phone",
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (
      req.user.role !== "admin" &&
      order.customer?._id.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ success: false, message: "Access denied" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/orders/:id/status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = [
      "processing",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!allowed.includes(orderStatus))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    const order = await Sale.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true },
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
