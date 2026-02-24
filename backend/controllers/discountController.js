const Discount = require("../models/Discount");

// GET /api/discount  — public, returns active discount or null
const getDiscount = async (req, res) => {
  try {
    const discount = await Discount.findOne({ isActive: true }).sort({
      updatedAt: -1,
    });
    res.json({ success: true, discount: discount || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/discount  — admin only, upsert the single discount document
const setDiscount = async (req, res) => {
  try {
    const { percentage, label, isActive } = req.body;
    if (percentage === undefined || percentage < 0 || percentage > 100)
      return res
        .status(400)
        .json({ success: false, message: "percentage must be 0–100" });

    // Deactivate all others first
    await Discount.updateMany({}, { isActive: false });

    // Upsert a single record
    const discount = await Discount.findOneAndUpdate(
      {}, // match any (we only keep one)
      {
        percentage: Number(percentage),
        label: label || "Sale",
        isActive: isActive !== false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/discount  — admin only, disable the discount
const disableDiscount = async (req, res) => {
  try {
    await Discount.updateMany({}, { isActive: false });
    res.json({ success: true, message: "Discount disabled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDiscount, setDiscount, disableDiscount };
