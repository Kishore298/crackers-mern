const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getPublicReviews,
  submitReview,
  getMyReview,
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
  broadcastReviewRequests,
} = require("../controllers/reviewController");

// Public — approved website reviews + google reviews
router.get("/public", getPublicReviews);

// Customer — submit / update review (auth required)
router.post("/", protect, submitReview);

// Customer — get own review
router.get("/mine", protect, getMyReview);

// Admin — all reviews with filters
router.get("/admin", protect, adminOnly, getAdminReviews);

// Admin — broadcast review requests to all customers
router.post("/admin/broadcast", protect, adminOnly, broadcastReviewRequests);

// Admin — approve / reject
router.put("/admin/:id/status", protect, adminOnly, updateReviewStatus);

// Admin — delete
router.delete("/admin/:id", protect, adminOnly, deleteReview);

module.exports = router;
