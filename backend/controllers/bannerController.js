const Banner = require("../models/Banner");
const { cloudinary } = require("../config/cloudinary");

// GET /api/banners (public - active only)
const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/banners/all (admin)
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/banners (admin)
const createBanner = async (req, res) => {
  try {
    const { title, link, isActive, order } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Banner image required" });

    const banner = await Banner.create({
      title,
      imageUrl: req.file.path,
      imagePublicId: req.file.filename,
      link: link || "/",
      isActive: isActive !== "false",
      order: Number(order) || 0,
    });
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/banners/:id (admin)
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });

    const { title, link, isActive, order } = req.body;
    if (title !== undefined) banner.title = title;
    if (link !== undefined) banner.link = link;
    if (isActive !== undefined)
      banner.isActive = isActive === "true" || isActive === true;
    if (order !== undefined) banner.order = Number(order);

    if (req.file) {
      if (banner.imagePublicId)
        await cloudinary.uploader.destroy(banner.imagePublicId);
      banner.imageUrl = req.file.path;
      banner.imagePublicId = req.file.filename;
    }

    await banner.save();
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/banners/:id (admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    if (banner.imagePublicId)
      await cloudinary.uploader.destroy(banner.imagePublicId);
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
