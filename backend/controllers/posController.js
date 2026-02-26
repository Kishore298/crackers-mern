const Sale = require("../models/Sale");
const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Discount = require("../models/Discount");

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

    // Fetch active global discount
    const activeDiscount = await Discount.findOne({ isActive: true });
    const discountPct = activeDiscount ? activeDiscount.percentage : 0;

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
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });

      // Apply global discount to base price, or use product's own discountedPrice
      let price;
      if (discountPct > 0) {
        price = Math.round(product.price * (1 - discountPct / 100));
      } else {
        price = product.discountedPrice || product.price;
      }

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

    // Calculate original total (without discount) for discount field
    const originalTotal = saleItems.reduce((sum, item) => {
      const product_original_price = items.find(
        (i) => i.product === item.product.toString(),
      );
      return sum + item.subtotal;
    }, 0);

    // Calculate what the total would have been at full price
    let fullPriceTotal = 0;
    for (const ci of items) {
      const product = await Product.findById(ci.product);
      fullPriceTotal += product.price * ci.quantity;
    }
    const discountAmount = fullPriceTotal - totalAmount;

    const sale = await Sale.create({
      saleType: "offline",
      customer: null,
      items: saleItems,
      totalAmount: fullPriceTotal,
      discount: discountAmount > 0 ? discountAmount : 0,
      finalPayable: totalAmount,
      paymentMethod,
      paymentStatus: "paid",
      orderStatus: "delivered",
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
