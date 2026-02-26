const Razorpay = require("razorpay");
const crypto = require("crypto");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../config/emailService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    if (!amount)
      return res
        .status(400)
        .json({ success: false, message: "Amount required" });

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency,
      receipt: `lash_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
      shippingAddress,
      couponCode,
      discount,
      totalAmount,
      finalPayable,
    } = req.body;

    // Signature verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Validate stock & build items array
    const items = [];
    for (const ci of cartItems) {
      const product = await Product.findById(ci.product);
      if (!product || !product.isActive)
        return res.status(400).json({
          success: false,
          message: `Product ${ci.name} not available`,
        });
      if (product.stock < ci.quantity)
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });

      const price = product.discountedPrice || product.price;
      items.push({
        product: product._id,
        name: product.name,
        price,
        quantity: ci.quantity,
        subtotal: price * ci.quantity,
      });
    }

    // Create sale record
    const sale = await Sale.create({
      saleType: "online",
      customer: req.user._id,
      items,
      totalAmount,
      discount: discount || 0,
      couponCode: couponCode || null,
      finalPayable,
      paymentMethod: "online",
      paymentStatus: "paid",
      orderStatus: "processing",
      shippingAddress,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Deduct stock and add ledger entries
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
      await StockLedger.create({
        product: item.product,
        type: "online_sale",
        quantity: -item.quantity,
        referenceId: sale._id,
        note: `Online order ${sale.invoiceNo}`,
        createdBy: req.user._id,
      });
    }

    // Send order confirmation email with PDF receipt (fire & forget)
    const customer = await User.findById(req.user._id).select(
      "name email phone",
    );
    if (customer?.email) {
      sendOrderConfirmationEmail(customer.email, sale, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }).catch((err) => console.error("Order email failed:", err.message));
    }

    res
      .status(201)
      .json({ success: true, sale, message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPaymentOrder, verifyPayment };
