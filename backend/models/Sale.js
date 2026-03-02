const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true }, // snapshot
  price: { type: Number, required: true }, // snapshot
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
});

const billingInfoSchema = new mongoose.Schema({
  name: { type: String, default: "Walk-in Customer" },
  phone: { type: String, default: "" },
});

// Auto-generate invoice number
const generateInvoiceNo = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LC-${dateStr}-${rand}`;
};

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      unique: true,
      default: generateInvoiceNo,
    },
    saleType: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    finalPayable: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "upi"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["processing", "packed", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    billingInfo: { type: billingInfoSchema, default: null }, // offline only
    shippingAddress: { type: shippingAddressSchema, default: null }, // online only
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationRequest: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date, default: null },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reason: { type: String, default: "" },
      adminNote: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sale", saleSchema);
