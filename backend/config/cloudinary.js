const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "lash-crackers/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "lash-crackers/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 500, crop: "limit" }],
  },
});

const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "lash-crackers/categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

const uploadProduct = multer({ storage: productStorage });
const uploadBanner = multer({ storage: bannerStorage });
const uploadCategory = multer({ storage: categoryStorage });

module.exports = { cloudinary, uploadProduct, uploadBanner, uploadCategory };
