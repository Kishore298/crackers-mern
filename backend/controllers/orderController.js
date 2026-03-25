const Sale = require("../models/Sale");
const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const User = require("../models/User");
const {
  sendOrderStatusEmail,
  sendCancellationEmail,
} = require("../config/emailService");
const { getIO } = require("../config/socket");
const Notification = require("../models/Notification");

// ─── Shared cancel helper ─────────────────────────────────────────
const performCancellation = async (order, adminNote = "") => {
  // Restock each item
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
      await StockLedger.create({
        product: item.product,
        type: "adjustment",
        quantity: item.quantity,
        referenceId: order._id,
        note: `Cancellation restock – ${order.invoiceNo}`,
      });
    }
  }

  // Update order
  order.orderStatus = "cancelled";
  order.paymentStatus = order.paymentMethod === "online" ? "refunded" : order.paymentStatus;
  if (order.cancellationRequest) {
    order.cancellationRequest.adminNote = adminNote;
    order.cancellationRequest.requested = false;
  }
  await order.save();

  // Send cancellation email to customer
  if (order.customer) {
    const customer = await User.findById(order.customer).select("name email");
    if (customer?.email) {
      sendCancellationEmail(customer.email, order, customer.name).catch((e) =>
        console.error("Cancellation email failed:", e.message),
      );
    }
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const {
      status,
      type,
      paymentStatus,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (req.user.role !== "admin") filter.customer = req.user._id;
    if (status) filter.orderStatus = status;
    if (type) filter.saleType = type;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Text search by invoiceNo (admin only can also search by customer name later via lookup)
    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Sale.countDocuments(filter);
    let orders = await Sale.find(filter)
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // If searching by customer name, do a secondary filter (post-query)
    if (search && req.user.role === "admin") {
      const regex = new RegExp(search, "i");
      // Find by invoiceNo OR customer name match
      const allMatched = await Sale.find({
        ...filter,
        $or: undefined,
      })
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 });

      const nameFiltered = allMatched.filter(
        (o) =>
          regex.test(o.invoiceNo) ||
          regex.test(o.customer?.name || "") ||
          regex.test(o.billingInfo?.name || ""),
      );

      const totalFiltered = nameFiltered.length;
      orders = nameFiltered.slice(skip, skip + Number(limit));

      return res.json({
        success: true,
        orders,
        total: totalFiltered,
        page: Number(page),
        pages: Math.ceil(totalFiltered / Number(limit)),
      });
    }

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

// ─── GET /api/orders/:id ──────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Sale.findById(req.params.id).populate(
      "customer",
      "name email phone",
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

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

// ─── PUT /api/orders/:id/status (admin) ──────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ["processing", "packed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(orderStatus))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const order = await Sale.findById(req.params.id).populate(
      "customer",
      "name email",
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Handle cancellation properly (restock etc.)
    if (orderStatus === "cancelled") {
      await performCancellation(order, req.body.adminNote || "");
    } else {
      order.orderStatus = orderStatus;
      await order.save();

      // Send status update email to customer
      if (order.customer?.email) {
        sendOrderStatusEmail(
          order.customer.email,
          order,
          order.customer.name,
          orderStatus,
        ).catch((e) => console.error("Status email failed:", e.message));
      }

      // Send WhatsApp status update
      if (order.customer?.phone) {
        const whatsapp = require("../config/whatsappService");
        const statusMeta = {
          processing: "Preparing",
          packed: "Packed",
          shipped: "Shipped",
          delivered: "Delivered",
          cancelled: "Cancelled"
        };
        const statusText = statusMeta[orderStatus] || orderStatus;
        
        // Assuming a generic status update template: "Hello {{1}}, your order {{2}} is now {{3}}. Track here: {{4}}"
        const trackingLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders`;
        const components = [
          {
            type: "body",
            parameters: [
              { type: "text", text: order.customer.name },
              { type: "text", text: order.invoiceNo },
              { type: "text", text: statusText },
              { type: "text", text: trackingLink }
            ]
          }
        ];
        whatsapp.sendMessage(order.customer.phone, "order_status_update", components)
          .catch((err) => console.error("Status WhatsApp failed:", err.message));
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/orders/:id/cancel-request (user) ──────────────────
const requestCancellation = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const order = await Sale.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Only the owner can request
    if (order.customer?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Access denied" });

    // Can only request if still processing
    if (order.orderStatus !== "processing")
      return res.status(400).json({
        success: false,
        message: "Cancellation can only be requested when order is in Processing status.",
      });

    if (order.cancellationRequest?.requested)
      return res.status(400).json({
        success: false,
        message: "Cancellation already requested.",
      });

    order.cancellationRequest = {
      requested: true,
      requestedAt: new Date(),
      requestedBy: req.user._id,
      reason,
      adminNote: "",
    };
    await order.save();

    // Notify admin via in-app + push
    try {
      const io = getIO();
      const adminNotif = await Notification.create({
        recipientRole: "admin",
        title: "Order Cancellation Request",
        body: `Customer requested cancellation for order ${order.invoiceNo}. Reason: ${reason || "No reason given"}`,
        type: "order",
        data: { saleId: order._id, invoiceNo: order.invoiceNo },
      });
      io.to("admin").emit("new_order", adminNotif);
    } catch (e) {
      console.error("Cancel notification failed:", e.message);
    }

    res.json({ success: true, order, message: "Cancellation request submitted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/orders/:id/cancel (admin) ─────────────────────────
const adminCancelOrder = async (req, res) => {
  try {
    const { adminNote = "" } = req.body;
    const order = await Sale.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderStatus === "cancelled")
      return res.status(400).json({ success: false, message: "Order already cancelled." });

    await performCancellation(order, adminNote);
    res.json({ success: true, order, message: "Order cancelled and stock restocked." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/orders/:id/cancel-reject (admin) ──────────────────
const rejectCancellationRequest = async (req, res) => {
  try {
    const { adminNote = "" } = req.body;
    const order = await Sale.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    order.cancellationRequest.requested = false;
    order.cancellationRequest.adminNote = adminNote;
    await order.save();

    res.json({ success: true, order, message: "Cancellation request rejected." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  requestCancellation,
  adminCancelOrder,
  rejectCancellationRequest,
};
