const mongoose = require("mongoose");

const optimizeCloudinaryUrl = (url, width) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  if (url.includes("/upload/q_auto")) return url;
  return url.replace("/upload/", `/upload/q_auto,f_auto,c_limit,w_${width}/`);
};

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    image: { 
      type: String, 
      default: "",
      get: (url) => optimizeCloudinaryUrl(url, 800)
    },
    imagePublicId: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

module.exports = mongoose.model("Category", categorySchema);
