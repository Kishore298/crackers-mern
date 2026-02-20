const Coupon = require("../models/Coupon");

// GET /api/coupons (admin)
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/coupons (admin)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      isActive,
      expiresAt,
    } = req.body;
    if (!code || !discountType || !discountValue || !expiresAt)
      return res
        .status(400)
        .json({
          success: false,
          message: "code, discountType, discountValue, expiresAt required",
        });

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      isActive,
      expiresAt,
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "Coupon code already exists" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/coupons/:id (admin)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/coupons/:id (admin)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/coupons/validate (user)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || !orderTotal)
      return res
        .status(400)
        .json({ success: false, message: "code and orderTotal required" });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Invalid or inactive coupon" });

    if (new Date() > new Date(coupon.expiresAt))
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired" });

    if (orderTotal < coupon.minOrderValue)
      return res.status(400).json({
        success: false,
        message: `Minimum order value ₹${coupon.minOrderValue} required`,
      });

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderTotal);

    res.json({
      success: true,
      discount: Math.round(discount),
      couponCode: coupon.code,
      message: `Coupon applied! You save ₹${Math.round(discount)}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
