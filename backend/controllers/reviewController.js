const Review = require("../models/Review");

// ─── PUBLIC: Get approved reviews (website + google) ──────────────
const getPublicReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      $or: [
        { source: "website", status: "approved" },
        { source: "google" },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("customerName rating comment source createdAt");

    const total = await Review.countDocuments({
      $or: [
        { source: "website", status: "approved" },
        { source: "google" },
      ],
    });

    // Compute aggregate stats
    const stats = await Review.aggregate([
      {
        $match: {
          $or: [
            { source: "website", status: "approved" },
            { source: "google" },
          ],
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      reviews,
      total,
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CUSTOMER: Submit a website review (auth required) ────────────
const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Check if user already has a website review
    const existing = await Review.findOne({
      customer: req.user._id,
      source: "website",
    });

    if (existing) {
      // Update existing review (resets to pending for re-moderation)
      existing.rating = rating;
      existing.comment = comment || "";
      existing.status = "pending";
      await existing.save();

      return res.json({
        success: true,
        review: existing,
        message: "Your review has been updated and is awaiting approval.",
        updated: true,
      });
    }

    const review = await Review.create({
      customer: req.user._id,
      customerName: req.user.name || "Customer",
      rating,
      comment: comment || "",
      source: "website",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      review,
      message: "Thank you! Your review has been submitted and is awaiting approval.",
      updated: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review.",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CUSTOMER: Get own review ─────────────────────────────────────
const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      customer: req.user._id,
      source: "website",
    });
    res.json({ success: true, review: review || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Get all reviews with filters ──────────────────────────
const getAdminReviews = async (req, res) => {
  try {
    const { status, source, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (source) filter.source = source;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("customer", "name phone email"),
      Review.countDocuments(filter),
    ]);

    // Counts for tabs
    const [pendingCount, approvedCount, rejectedCount, googleCount] =
      await Promise.all([
        Review.countDocuments({ source: "website", status: "pending" }),
        Review.countDocuments({ source: "website", status: "approved" }),
        Review.countDocuments({ source: "website", status: "rejected" }),
        Review.countDocuments({ source: "google" }),
      ]);

    res.json({
      success: true,
      reviews,
      total,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        google: googleCount,
        all: pendingCount + approvedCount + rejectedCount + googleCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Update review status ──────────────────────────────────
const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Delete review ─────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const Review = require("../models/Review");
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Broadcast Review Links ────────────────────────────────
const broadcastReviewRequests = async (req, res) => {
  try {
    const User = require("../models/User");
    const Setting = require("../models/Setting");
    const WhatsAppService = require("../config/whatsappService");
    const whatsapp = new WhatsAppService();

    if (!whatsapp.isConfigured) {
      return res.status(400).json({ success: false, message: "WhatsApp is not configured." });
    }

    const settingsDocs = await Setting.find();
    let googleReviewUrl = "";
    settingsDocs.forEach((s) => {
      if (s.key === "googleReviewUrl") googleReviewUrl = s.value;
    });

    const frontendUrl = process.env.FRONTEND_URL || "https://vcrackers.in";
    const reviewLink = `${frontendUrl}/review`;

    const Sale = require("../models/Sale");

    // Fetch all online customers with phone numbers
    const onlineCustomers = await User.find({ role: "customer", phone: { $exists: true, $ne: "" }, isActive: true });
    
    // Fetch offline (POS) sales with phone numbers to get POS customers
    const posSales = await Sale.find({ 
      saleType: "offline", 
      "billingInfo.phone": { $exists: true, $ne: "" } 
    });

    // Extract unique POS customers by phone
    const posCustomersMap = new Map();
    posSales.forEach(sale => {
      const phone = sale.billingInfo.phone.trim();
      if (phone) {
        posCustomersMap.set(phone, sale.billingInfo.name || "Customer");
      }
    });

    // Remove any POS customer who is also an online customer (to avoid duplicate messaging)
    onlineCustomers.forEach(customer => {
      const rawPhone = customer.phone.replace(/\D/g, "");
      const fullPhone = customer.phone.startsWith("91") ? customer.phone : `91${rawPhone}`;
      // Clean map by full phone or raw phone
      if (posCustomersMap.has(fullPhone)) posCustomersMap.delete(fullPhone);
      if (posCustomersMap.has(rawPhone)) posCustomersMap.delete(rawPhone);
      if (posCustomersMap.has(customer.phone)) posCustomersMap.delete(customer.phone);
    });

    const posCustomers = Array.from(posCustomersMap.entries()).map(([phone, name]) => ({ phone, name }));
    const totalCount = onlineCustomers.length + posCustomers.length;
    
    if (totalCount === 0) {
      return res.json({ success: true, message: "No customers found to send requests to." });
    }

    // Send in background to avoid blocking request for too long
    res.json({ success: true, message: `Broadcasting review requests to ${onlineCustomers.length} online and ${posCustomers.length} POS customers in the background.` });

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    (async () => {
      // 1. Send to Online Customers
      for (const customer of onlineCustomers) {
        try {
          const customerPhone = customer.phone.startsWith("91") ? customer.phone : `91${customer.phone.replace(/\D/g, "")}`;
          await whatsapp.sendReviewRequest(customerPhone, {
            name: customer.name || "Customer",
            reviewLink,
            googleReviewUrl,
          });
          await delay(200); // Small delay to prevent rate limits
        } catch (e) {
          console.error(`[WhatsApp] Failed to broadcast review request to online customer ${customer.phone}:`, e.message);
        }
      }

      // 2. Send to POS Customers (Google Review Link only, since they don't have website accounts)
      if (googleReviewUrl) {
        for (const customer of posCustomers) {
          try {
            const customerPhone = customer.phone.startsWith("91") ? customer.phone : `91${customer.phone.replace(/\D/g, "")}`;
            await whatsapp.sendPosReviewRequest(customerPhone, {
              name: customer.name || "Customer",
              googleReviewUrl,
            });
            await delay(200);
          } catch (e) {
            console.error(`[WhatsApp] Failed to broadcast review request to POS customer ${customer.phone}:`, e.message);
          }
        }
      }

      console.log(`[WhatsApp] Finished broadcasting review requests to ${totalCount} total customers.`);
    })();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPublicReviews,
  submitReview,
  getMyReview,
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
  broadcastReviewRequests,
};
