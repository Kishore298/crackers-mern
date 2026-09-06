const mongoose = require("mongoose");

const optimizeCloudinaryUrl = (url, width) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  if (url.includes("/upload/q_auto")) return url;
  return url.replace("/upload/", `/upload/q_auto,f_auto,c_limit,w_${width}/`);
};

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    imageUrl: { 
      type: String, 
      required: true,
      get: (url) => optimizeCloudinaryUrl(url, 1600)
    },
    imagePublicId: { type: String, default: "" },
    link: { type: String, default: "/" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

module.exports = mongoose.model("Banner", bannerSchema);
