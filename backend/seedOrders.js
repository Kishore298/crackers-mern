const mongoose = require("mongoose");
const Category = require("./models/Category");
require("dotenv").config();

const CATEGORY_ORDER_SLUGS = [
  "single-sound-crackers",
  "premium-bomb",
  "paper-bomb",
  "k-series",
  "flowerpots",
  "special-mud-pots",
  "ground-chakkar",
  "rockets",
  "twinkling-stars-and-color-candles",
  "sparklers",
  "color-matches",
  "skyshots",
  "peacock-series",
  "2026-special-fountains-and-new-arrivals"
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const categories = await Category.find();
  for (const cat of categories) {
    const idx = CATEGORY_ORDER_SLUGS.indexOf(cat.slug);
    cat.order = idx === -1 ? 999 : idx;
    await cat.save();
  }

  console.log("Migration complete");
  process.exit(0);
};

run();
