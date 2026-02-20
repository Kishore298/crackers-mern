const Sale = require("../models/Sale");
const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");

// POST /api/pos/bill (admin only)
const createPosBill = async (req, res) => {
  try {
    const { items, paymentMethod, billingInfo } = req.body;
    if (!items || !items.length)
      return res
        .status(400)
        .json({ success: false, message: "Items required" });
    if (!paymentMethod)
      return res
        .status(400)
        .json({ success: false, message: "Payment method required" });

    // Validate items and build
    const saleItems = [];
    let totalAmount = 0;

    for (const ci of items) {
      const product = await Product.findById(ci.product);
      if (!product)
        return res
          .status(400)
          .json({ success: false, message: `Product ${ci.product} not found` });
      if (product.stock < ci.quantity)
        return res
          .status(400)
          .json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });

      const price = product.discountedPrice || product.price;
      const subtotal = price * ci.quantity;
      totalAmount += subtotal;
      saleItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity: ci.quantity,
        subtotal,
      });
    }

    const sale = await Sale.create({
      saleType: "offline",
      customer: null,
      items: saleItems,
      totalAmount,
      discount: 0,
      finalPayable: totalAmount,
      paymentMethod,
      paymentStatus: "paid",
      orderStatus: "delivered", // offline = immediately delivered
      billingInfo: billingInfo || { name: "Walk-in Customer", phone: "" },
      createdBy: req.user._id,
    });

    // Deduct stock and write ledger
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
      await StockLedger.create({
        product: item.product,
        type: "offline_sale",
        quantity: -item.quantity,
        referenceId: sale._id,
        note: `POS bill ${sale.invoiceNo}`,
        createdBy: req.user._id,
      });
    }

    res
      .status(201)
      .json({ success: true, sale, message: "Bill generated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPosBill };
