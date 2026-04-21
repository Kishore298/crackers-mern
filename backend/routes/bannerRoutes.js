const express = require("express");
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadBanner } = require("../config/cloudinary");
const { handleMethodOverride } = require("../middleware/methodOverride");

router.get("/", getActiveBanners);
router.get("/all", protect, adminOnly, getAllBanners);
router.post(
  "/",
  protect,
  adminOnly,
  uploadBanner.single("image"),
  createBanner,
);

// ORIGINAL ROUTES
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadBanner.single("image"),
  updateBanner,
);
router.delete("/:id", protect, adminOnly, deleteBanner);

// MILESWEB FALLBACKS
router.post(
  "/:id",
  protect,
  adminOnly,
  uploadBanner.single("image"),
  handleMethodOverride({
    PUT: updateBanner,
    DELETE: deleteBanner,
  })
);

module.exports = router;
