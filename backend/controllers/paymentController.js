const mongoose = require("mongoose");
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

// ─── Shared helper: validate items (optimistic) ──────────────
const buildValidatedItems = async (cartItems) => {
  const items = [];
  const globalDiscount = await Discount.findOne({ isActive: true });
  const discountPct = globalDiscount ? globalDiscount.percentage : 0;

  for (const ci of cartItems) {
    const product = await Product.findById(ci.product);
    if (!product || !product.isActive)
      throw Object.assign(new Error(`Product ${ci.name} is not available`), { status: 400 });
    
    // Optimistic stock check (atomic check happens in transaction)
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

// ─── Shared helper: deduct stock (Atomic within Transaction) ────────
const deductStockAtomic = async (items, saleId, userId, session) => {
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
      { $inc: { stock: -item.quantity } },
      { session, new: true }
    );
    
    if (!product) {
      throw Object.assign(new Error(`Product ${item.name} is unavailable or has insufficient stock.`), { status: 400 });
    }

    await StockLedger.create([{
      product: item.product,
      type: "online_sale",
      quantity: -item.quantity,
      referenceId: saleId,
      note: `Online order ${saleId}`,
      createdBy: userId,
    }], { session });
  }
};

// ─── Helper: send receipts & notifications (fire-and-forget) ────────
const sendPostOrderComms = async (sale, customer) => {
  if (customer.email) {
    sendOrderConfirmationEmail(customer.email, sale, customer).catch((e) =>
      console.error("[Email] Order confirmation failed:", e.message)
    );
  }

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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { cartItems, shippingAddress, couponCode } = req.body;

    // Build items and optimism check
    let items;
    try {
      items = await buildValidatedItems(cartItems);
    } catch (e) {
      throw e; // Caught by the transaction abort block
    }

    const serverSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    if (serverSubtotal < MIN_CART_VALUE) {
      throw Object.assign(new Error(`Minimum order value is ₹${MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.`), { status: 400 });
    }

    let serverFinalPayable = serverSubtotal;
    let couponDiscount = 0;

    // Handle Coupon (Atomically within session)
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
      if (!coupon) throw Object.assign(new Error("Invalid coupon code."), { status: 400 });

      let isValid = serverSubtotal >= coupon.minOrderValue;
      if (coupon.startDate) isValid = isValid && new Date() >= new Date(coupon.startDate);
      if (coupon.expiresAt) isValid = isValid && new Date() <= new Date(coupon.expiresAt);

      let limitExceeded = false;
      if (coupon.usageLimit > 0) {
        const totalUsed = coupon.usedBy.reduce((acc, curr) => acc + curr.count, 0);
        if (totalUsed >= coupon.usageLimit) limitExceeded = true;
      }
      if (coupon.perUserLimit > 0) {
        const userUsage = coupon.usedBy.find(u => u.user.toString() === req.user._id.toString());
        if (userUsage && userUsage.count >= coupon.perUserLimit) limitExceeded = true;
      }

      if (!isValid || limitExceeded) {
        throw Object.assign(new Error("Coupon is invalid, expired, or limit exceeded."), { status: 400 });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount = (serverSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.round(Math.min(couponDiscount, serverSubtotal));
      serverFinalPayable -= couponDiscount;

      // Update coupon usage
      const userUsageIdx = coupon.usedBy.findIndex(u => u.user.toString() === req.user._id.toString());
      if (userUsageIdx > -1) {
        coupon.usedBy[userUsageIdx].count += 1;
      } else {
        coupon.usedBy.push({ user: req.user._id, count: 1 });
      }
      await coupon.save({ session });
    }

    const packagingCharges = Math.round(serverFinalPayable * 0.02);
    serverFinalPayable += packagingCharges;

    // Create Sale
    const [sale] = await Sale.create([{
      saleType: "online",
      customer: req.user._id,
      items,
      totalAmount: serverSubtotal,
      discount: couponDiscount,
      packagingCharges,
      slabDiscount: 0,
      slabLabel: null,
      couponCode: couponCode || null,
      finalPayable: serverFinalPayable,
      paymentMethod: "offline",
      paymentStatus: "pending",
      orderStatus: "processing",
      shippingAddress,
    }], { session });

    // Deduct stock atomically
    await deductStockAtomic(items, sale._id, req.user._id, session);

    // Clear purchased items from DB cart
    const purchasedProductIds = items.map(i => i.product.toString());
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: { product: { $in: purchasedProductIds } } }
    }, { session });

    await session.commitTransaction();
    session.endSession();

    // Fire-and-forget non-transactional operations
    const userDoc = await User.findById(req.user._id).select("name phone email");
    const customer = {
      name: userDoc?.name || shippingAddress?.fullName || "Customer",
      email: userDoc?.email || shippingAddress?.email,
      phone: userDoc?.phone || shippingAddress?.phone
    };
    sendPostOrderComms(sale, customer);

    try {
      const { getIO } = require("../config/socket");
      const Notification = require("../models/Notification");
      const adminNotif = await Notification.create({
        recipientRole: "admin",
        title: "New Order Received!",
        body: `Order ${sale.invoiceNo} placed by ${customer.name}. Amount: Rs.${serverFinalPayable}. Payment Pending.`,
        type: "order",
        data: { saleId: sale._id, invoiceNo: sale.invoiceNo },
      });
      getIO().to("admin").emit("new_order", adminNotif.toJSON ? adminNotif.toJSON() : adminNotif);
    } catch (e) {
      console.error("Failed to notify admin via socket:", e);
    }

    res.json({ success: true, sale });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Place order error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = {
  placeOfflineOrder,
};
