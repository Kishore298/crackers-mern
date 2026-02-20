const mongoose = require("mongoose");

const stockLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["online_sale", "offline_sale", "restock", "correction"],
      required: true,
    },
    quantity: { type: Number, required: true }, // negative for sales
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    }, // saleId or restockId
    note: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StockLedger", stockLedgerSchema);
