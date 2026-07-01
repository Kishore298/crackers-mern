const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Sale     = require("../models/Sale");
const Product  = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Coupon   = require("../models/Coupon");
const User     = require("../models/User");
const { sendOrderConfirmationEmail } = require("../config/emailService");
const { generateReceiptPDF }        = require("../config/pdfService");
const whatsapp = require("../config/whatsappService");
const { MIN_CART_VALUE, calculateSlabDiscount } = require("../config/discountSlabs");

const razorpay = new Razorpay({
  key_id    : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Shared helper: validate stock & build item array ──────────────
const buildValidatedItems = async (cartItems) => {
  const items = [];
  for (const ci of cartItems) {
    const product = await Product.findById(ci.product);
    if (!product || !product.isActive)
      throw Object.assign(new Error(`Product ${ci.name} is not available`), { status: 400 });
    if (product.stock < ci.quantity)
      throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });

    const price = product.discountedPrice || product.price;
    items.push({
      product : product._id,
      name    : product.name,
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
      product    : item.product,
      type       : "online_sale",
      quantity   : -item.quantity,
      referenceId: saleId,
      note       : `Online order ${saleId}`,
      createdBy  : userId,
    });
  }
};

// ─── Shared helper: create Razorpay Payment Link for COD ────────────
const createRazorpayPaymentLink = async (sale, customer) => {
  try {
    const link = await razorpay.paymentLink.create({
      amount      : Math.round(sale.finalPayable * 100), // paise
      currency    : "INR",
      accept_partial: false,
      description : `Payment for Order ${sale.invoiceNo} | V Crackers`,
      customer    : {
        name   : customer.name  || "Customer",
        contact: customer.phone || "",
        email  : customer.email || "",
      },
      notify       : { sms: false, email: false, whatsapp: false }, // we handle notify ourselves
      reminder_enable: false,
      notes        : { order_id: sale._id.toString(), invoice_no: sale.invoiceNo },
      // Razorpay will redirect here after successful payment
      callback_url : `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-success?ref=${sale.invoiceNo}`,
      callback_method: "get",
    });

    return { id: link.id, shortUrl: link.short_url };
  } catch (err) {
    console.error("[Razorpay] Payment link creation failed:", err.message);
    return null;
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
        name     : customer.name,
        orderId  : sale.invoiceNo,
        pdfBuffer,
        filename : `Receipt-${sale.invoiceNo}.pdf`,
      }).catch((e) => console.error("[WhatsApp] Receipt send failed:", e.message));
    } catch (e) {
      console.error("[WhatsApp] PDF generation failed:", e.message);
    }
  }
};

// ─── POST /api/payment/create-order ────────────────────────────────
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    if (!amount)
      return res.status(400).json({ success: false, message: "Amount required" });

    const options = {
      amount : Math.round(amount * 100),
      currency,
      receipt: `vcrackers_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payment/verify ───────────────────────────────────────
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

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ success: false, message: "Payment verification failed" });

    // Validate stock
    let items;
    try {
      items = await buildValidatedItems(cartItems);
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, message: e.message });
    }

    // ─── Server-side subtotal & validations ─────────────────────────
    const serverSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Minimum cart value check
    if (serverSubtotal < MIN_CART_VALUE) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.`,
      });
    }

    // Server-side slab discount (never trust frontend discount value)
    const { discount: serverSlabDiscount, label: slabLabel } = calculateSlabDiscount(serverSubtotal);
    const serverFinalPayable = serverSubtotal - serverSlabDiscount;

    // Create sale
    const sale = await Sale.create({
      saleType         : "online",
      customer         : req.user._id,
      items,
      totalAmount      : serverSubtotal,
      discount         : serverSlabDiscount,
      slabDiscount     : serverSlabDiscount,
      slabLabel,
      couponCode       : couponCode || null,
      finalPayable     : serverFinalPayable,
      paymentMethod    : "online",
      paymentStatus    : "paid",
      orderStatus      : "processing",
      shippingAddress,
      razorpayOrderId  : razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Deduct stock
    await deductStock(items, sale._id, req.user._id);

    // Fetch customer details
    const customer = await User.findById(req.user._id).select("name email phone");

    // Fire-and-forget: email + WhatsApp receipt
    sendPostOrderComms(sale, customer);

    // Also send a plain order-confirmation WhatsApp (no PDF needed — receipt is PDF)
    if (customer?.phone) {
      const trackingLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders/${sale._id}`;
      whatsapp.sendOrderConfirmation(customer.phone, {
        name        : customer.name,
        orderId     : sale.invoiceNo,
        amount      : serverFinalPayable,
        trackingLink,
      }).catch((e) => console.error("[WhatsApp] Order confirmation failed:", e.message));
    }

    // Admin notification via Socket.IO
    try {
      const { getIO }      = require("../config/socket");
      const Notification   = require("../models/Notification");
      const adminNotif = await Notification.create({
        recipientRole: "admin",
        title        : "New Online Order",
        body         : `Order ${sale.invoiceNo} placed by ${customer?.name || "Customer"}. Amount: Rs.${serverFinalPayable}`,
        type         : "order",
        data         : { saleId: sale._id, invoiceNo: sale.invoiceNo },
      });
      getIO().to("admin").emit("new_order", adminNotif);
    } catch (e) {
      console.error("[Socket] Admin notification failed:", e.message);
    }

    res.status(201).json({ success: true, sale, message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payment/place-cod-order ─────────────────────────────
/**
 * Place a Cash-on-Delivery order.
 * Flow:
 *  1. Validate stock → create Sale (paymentMethod=cod, paymentStatus=pending)
 *  2. Deduct stock
 *  3. Send PDF receipt via WhatsApp + email
 *  4. Create Razorpay Payment Link
 *  5. Save link details on Sale
 *  6. Send payment link via WhatsApp so customer can pay online if desired
 *  7. Notify admin
 */
const placeCODOrder = async (req, res) => {
  try {
    const {
      cartItems,
      shippingAddress,
      couponCode,
      discount,
      totalAmount,
      finalPayable,
    } = req.body;

    if (!cartItems || cartItems.length === 0)
      return res.status(400).json({ success: false, message: "Cart is empty" });

    // Validate stock
    let items;
    try {
      items = await buildValidatedItems(cartItems);
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, message: e.message });
    }

    // ─── Server-side subtotal & validations ─────────────────────────
    const serverSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Minimum cart value check
    if (serverSubtotal < MIN_CART_VALUE) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.`,
      });
    }

    // Server-side slab discount (never trust frontend discount value)
    const { discount: serverSlabDiscount, label: slabLabel } = calculateSlabDiscount(serverSubtotal);
    const serverFinalPayable = serverSubtotal - serverSlabDiscount;

    // Create COD sale record
    const sale = await Sale.create({
      saleType     : "online",
      customer     : req.user._id,
      items,
      totalAmount  : serverSubtotal,
      discount     : serverSlabDiscount,
      slabDiscount : serverSlabDiscount,
      slabLabel,
      couponCode   : couponCode || null,
      finalPayable : serverFinalPayable,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus  : "processing",
      shippingAddress,
    });

    // Deduct stock
    await deductStock(items, sale._id, req.user._id);

    // Fetch customer
    const customer = await User.findById(req.user._id).select("name email phone");

    // ── Fire-and-forget communications ──
    (async () => {
      try {
        // a) Email + WhatsApp PDF receipt
        await sendPostOrderComms(sale, customer);

        // b) Create Razorpay Payment Link
        const linkData = await createRazorpayPaymentLink(sale, customer);

        if (linkData) {
          // Persist link on sale
          await Sale.findByIdAndUpdate(sale._id, {
            razorpayPaymentLinkId : linkData.id,
            razorpayPaymentLinkUrl: linkData.shortUrl,
          });

          // c) Send payment link via WhatsApp
          if (customer?.phone && linkData.shortUrl) {
            await whatsapp.sendCODPaymentLink(customer.phone, {
              name       : customer.name,
              orderId    : sale.invoiceNo,
              amount     : serverFinalPayable,
              paymentLink: linkData.shortUrl,
            });
          }
        }
      } catch (e) {
        console.error("[COD] Post-order comms error:", e.message);
      }
    })();

    // Admin notification
    try {
      const { getIO }    = require("../config/socket");
      const Notification = require("../models/Notification");
      const adminNotif   = await Notification.create({
        recipientRole: "admin",
        title        : "New COD Order",
        body         : `COD Order ${sale.invoiceNo} placed by ${customer?.name || "Customer"}. Amount: Rs.${serverFinalPayable}`,
        type         : "order",
        data         : { saleId: sale._id, invoiceNo: sale.invoiceNo },
      });
      getIO().to("admin").emit("new_order", adminNotif);
    } catch (e) {
      console.error("[Socket] Admin notification failed:", e.message);
    }

    res.status(201).json({ success: true, sale, message: "COD order placed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payment/resend-payment-link/:orderId (admin) ─────────
/**
 * Admin can manually resend/regenerate the Razorpay payment link
 * for a COD order (in case the customer lost it).
 */
const resendCODPaymentLink = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.orderId).populate("customer", "name email phone");
    if (!sale)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (sale.paymentMethod !== "cod")
      return res.status(400).json({ success: false, message: "Not a COD order" });

    if (sale.paymentStatus === "paid")
      return res.status(400).json({ success: false, message: "Order already paid" });

    const customer = sale.customer;
    if (!customer?.phone)
      return res.status(400).json({ success: false, message: "Customer phone not available" });

    // Generate new payment link
    const linkData = await createRazorpayPaymentLink(sale, customer);
    if (!linkData)
      return res.status(500).json({ success: false, message: "Failed to create payment link" });

    // Persist on sale
    await Sale.findByIdAndUpdate(sale._id, {
      razorpayPaymentLinkId : linkData.id,
      razorpayPaymentLinkUrl: linkData.shortUrl,
    });

    // Send via WhatsApp
    await whatsapp.sendCODPaymentLink(customer.phone, {
      name       : customer.name,
      orderId    : sale.invoiceNo,
      amount     : sale.finalPayable,
      paymentLink: linkData.shortUrl,
    });

    res.json({ success: true, paymentLink: linkData.shortUrl, message: "Payment link sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payment/webhook (Razorpay webhook) ───────────────────
/**
 * Razorpay calls this endpoint when a payment link is paid.
 * Registered in Razorpay Dashboard → Webhooks.
 * Events: payment_link.paid
 *
 * NOTE: This route is mounted in index.js BEFORE express.json()
 * so req.body is a raw Buffer (from express.raw). We parse it here.
 */
const razorpayWebhook = async (req, res) => {
  try {
    // req.body is a raw Buffer (sent via express.raw middleware in index.js)
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify HMAC signature
    if (webhookSecret && webhookSecret !== "your_razorpay_webhook_secret_here") {
      const signature = req.headers["x-razorpay-signature"];
      const expected  = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expected) {
        console.warn("[Webhook] Invalid Razorpay signature – rejected");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
    }

    // Parse JSON body
    const event = JSON.parse(rawBody.toString("utf8"));
    console.log(`[Webhook] Razorpay event received: ${event.event}`);

    // Handle payment_link.paid
    if (event.event === "payment_link.paid") {
      const paymentLinkId = event.payload?.payment_link?.entity?.id;
      const paymentId     = event.payload?.payment?.entity?.id;
      const amount        = event.payload?.payment?.entity?.amount; // paise

      if (paymentLinkId) {
        const sale = await Sale.findOne({ razorpayPaymentLinkId: paymentLinkId })
          .populate("customer", "name email phone");

        if (sale && sale.paymentStatus !== "paid") {
          sale.paymentStatus     = "paid";
          sale.razorpayPaymentId = paymentId;
          await sale.save();

          console.log(`[Webhook] COD order ${sale.invoiceNo} marked as PAID`);

          // WhatsApp: notify customer that payment was accepted
          if (sale.customer?.phone) {
            const trackingLink =
              `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders/${sale._id}`;
            whatsapp.sendOrderStatusUpdate(sale.customer.phone, {
              name        : sale.customer.name,
              orderId     : sale.invoiceNo,
              status      : "paid",
              trackingLink,
            }).catch((e) => console.error("[WhatsApp] Payment confirm failed:", e.message));
          }

          // Admin socket notification
          try {
            const { getIO }    = require("../config/socket");
            const Notification = require("../models/Notification");
            const notif = await Notification.create({
              recipientRole: "admin",
              title        : "COD Payment Received",
              body         : `Order ${sale.invoiceNo} paid online. Amount: Rs.${(amount || 0) / 100}`,
              type         : "payment",
              data         : { saleId: sale._id, invoiceNo: sale.invoiceNo },
            });
            getIO().to("admin").emit("payment_received", notif);
          } catch (e) {
            console.error("[Socket] Webhook admin notification failed:", e.message);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Webhook] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  placeCODOrder,
  resendCODPaymentLink,
  razorpayWebhook,
};
