const Sale = require("../models/Sale");
const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Coupon = require("../models/Coupon");
const Discount = require("../models/Discount");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../config/emailService");
const { generateReceiptPDF } = require("../config/pdfService");
const whatsapp = require("../config/whatsappService");
const { MIN_CART_VALUE } = require("../config/discountSlabs");

// ─── Shared helper: validate stock & build item array ──────────────
const buildValidatedItems = async (cartItems) => {
  const items = [];

  // Fetch global discount to match frontend effective price calculation
  const globalDiscount = await Discount.findOne({ isActive: true });
  const discountPct = globalDiscount ? globalDiscount.percentage : 0;

  for (const ci of cartItems) {
    const product = await Product.findById(ci.product);
    if (!product || !product.isActive)
      throw Object.assign(new Error(`Product ${ci.name} is not available`), { status: 400 });
    if (product.stock < ci.quantity)
      throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });

    const basePrice = product.price;
    let price;
    if (product.isCombo) {
      price = product.price;
    } else {
      price = discountPct > 0
        ? Math.round(basePrice * (1 - discountPct / 100))
        : (product.discountedPrice ?? basePrice);
    }

    items.push({
      product: product._id,
      name: product.name,
      price,
      quantity: ci.quantity,
      subtotal: price * ci.quantity,
    });
  }

  return items;
};

// ─── Shared helper: deduct stock ────────────────────────────────────
const deductStock = async (items, saleId, userId) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    await StockLedger.create({
      product: item.product,
      type: "online_sale",
      quantity: -item.quantity,
      referenceId: saleId,
      note: `Online order ${saleId}`,
      createdBy: userId,
    });
  }
};

// ─── Helper: send receipts & notifications (fire-and-forget) ────────
const sendPostOrderComms = async (sale, customer) => {
  const trackingLink =
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders/${sale._id}`;

  // 1. Email confirmation with PDF
  if (customer.email) {
    sendOrderConfirmationEmail(customer.email, sale, customer).catch((e) =>
      console.error("[Email] Order confirmation failed:", e.message)
    );
  }

  // 2. WhatsApp PDF receipt
  if (customer.phone) {
    try {
      const pdfBuffer = await generateReceiptPDF(sale, customer);
      whatsapp.sendOrderReceipt(customer.phone, {
        name: customer.name,
        orderId: sale.invoiceNo,
        amount: sale.finalPayable,
        pdfBuffer,
        filename: `Receipt-${sale.invoiceNo}.pdf`,
      }).catch((e) => console.error("[WhatsApp] Receipt send failed:", e.message));
    } catch (e) {
      console.error("[WhatsApp] PDF generation failed:", e.message);
    }
  }
};

// ─── POST /api/payment/place-offline (Manual GPay Payment) ────────────
const placeOfflineOrder = async (req, res) => {
  try {
    const {
      cartItems,
      shippingAddress,
      couponCode,
    } = req.body;

    // Validate stock
    let items;
    try {
      items = await buildValidatedItems(cartItems);
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, message: e.message });
    }

    // Server-side subtotal & validations
    const serverSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Minimum cart value check
    if (serverSubtotal < MIN_CART_VALUE) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.`,
      });
    }

    let serverFinalPayable = serverSubtotal;
    let couponDiscount = 0;

    // Apply Coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        // Validation checks
        const isValid =
          new Date() >= new Date(coupon.startDate) &&
          new Date() <= new Date(coupon.expiresAt) &&
          serverSubtotal >= coupon.minOrderValue;

        let limitExceeded = false;

        if (coupon.usageLimit > 0) {
          const totalUsed = coupon.usedBy.reduce((acc, curr) => acc + curr.count, 0);
          if (totalUsed >= coupon.usageLimit) limitExceeded = true;
        }

        if (coupon.perUserLimit > 0) {
          const userUsage = coupon.usedBy.find(u => u.user.toString() === req.user._id.toString());
          if (userUsage && userUsage.count >= coupon.perUserLimit) limitExceeded = true;
        }

        if (isValid && !limitExceeded) {
          if (coupon.discountType === "percentage") {
            couponDiscount = (serverSubtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          } else {
            couponDiscount = coupon.discountValue;
          }
          couponDiscount = Math.round(Math.min(couponDiscount, serverSubtotal));
          serverFinalPayable -= couponDiscount;

          // Record usage
          const userUsageIdx = coupon.usedBy.findIndex(u => u.user.toString() === req.user._id.toString());
          if (userUsageIdx > -1) {
            coupon.usedBy[userUsageIdx].count += 1;
          } else {
            coupon.usedBy.push({ user: req.user._id, count: 1 });
          }
          await coupon.save();
        }
      }
    }

    // Create sale as Pending
    const sale = await Sale.create({
      saleType: "online",
      customer: req.user._id,
      items,
      totalAmount: serverSubtotal,
      discount: couponDiscount,
      slabDiscount: 0,
      slabLabel: null,
      couponCode: couponCode || null,
      finalPayable: serverFinalPayable,
      paymentMethod: "offline",
      paymentStatus: "pending",
      orderStatus: "processing",
      shippingAddress,
    });

    // Deduct stock
    await deductStock(items, sale._id, req.user._id);

    // Fetch customer details
    const userDoc = await User.findById(req.user._id).select("name phone email");
    const customer = {
      name: userDoc?.name || shippingAddress?.fullName || "Customer",
      email: userDoc?.email || shippingAddress?.email,
      phone: userDoc?.phone || shippingAddress?.phone
    };

    // Fire-and-forget: email + WhatsApp receipt
    sendPostOrderComms(sale, customer);

    // Admin notification
    try {
      const { getIO } = require("../config/socket");
      const Notification = require("../models/Notification");
      const adminNotif = await Notification.create({
        recipientRole: "admin",
        title: "New Order Received!",
        body: `Order ${sale.invoiceNo} placed by ${customer?.name || "Customer"}. Amount: Rs.${serverFinalPayable}. Payment Pending.`,
        type: "order",
        data: { saleId: sale._id, invoiceNo: sale.invoiceNo },
      });
      const io = getIO();
      io.to("admin").emit("new_order", adminNotif.toJSON ? adminNotif.toJSON() : adminNotif);

      // Send Push Notification to all Admins
      const { sendPushToTokens } = require("../config/firebase");
      const adminUsers = await User.find({
        role: "admin",
        fcmTokens: { $exists: true, $ne: [] }
      }).select("fcmTokens");

      const allAdminTokens = adminUsers.flatMap((u) => u.fcmTokens);
      if (allAdminTokens.length > 0) {
        const { invalidTokens } = await sendPushToTokens(
          allAdminTokens,
          adminNotif.title,
          adminNotif.body,
          { actionUrl: "/orders" }
        );
        if (invalidTokens && invalidTokens.length > 0) {
          await User.updateMany(
            { role: "admin", fcmTokens: { $in: invalidTokens } },
            { $pullAll: { fcmTokens: invalidTokens } }
          );
        }
      }
    } catch (e) {
      console.error("Failed to notify admin via socket:", e);
    }

    res.json({ success: true, sale });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  placeOfflineOrder,
};
