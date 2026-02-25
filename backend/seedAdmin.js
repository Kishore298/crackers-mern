/**
 * seedAdmin.js — run once to create the admin user
 * Usage: node backend/seedAdmin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const phone = "7824907916"; // normalised (no spaces)
  const email = "vcrackers2026@gmail.com";

  // Check if admin already exists
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    console.log("ℹ️  Admin user already exists:", existing.email);
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash("VLK@2023", 12);

  const admin = await User.create({
    name: "Vignesh Kumar",
    email,
    phone,
    password,
    role: "admin",
    isActive: true,
  });

  console.log("🎉 Admin user created:", admin.email, "| phone:", admin.phone);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
