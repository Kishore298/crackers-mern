require("dotenv").config();
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const { initFirebase } = require("./config/firebase");

// Route imports
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const posRoutes = require("./routes/posRoutes");
const stockRoutes = require("./routes/stockRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const discountRoutes = require("./routes/discountRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const fcmRoutes = require("./routes/fcmRoutes");

// Connect to MongoDB
connectDB();

// Initialize Firebase (graceful if no config)
initFirebase();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// ── Razorpay webhook needs raw body for HMAC verification ──
// Mount BEFORE express.json() so the body is not parsed
const { razorpayWebhook } = require("./controllers/paymentController");
app.post("/api/payment/webhook", express.raw({ type: "*/*" }), razorpayWebhook);

// Security & parsing middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
  "https://www.vcrackers.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-HTTP-Method-Override"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Method Override Middleware for Milesweb (Handling 403 on PUT/DELETE)
app.use((req, res, next) => {
  if (req.method === "POST" && req.headers["x-http-method-override"]) {
    req.method = req.headers["x-http-method-override"].toUpperCase();
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "V Crackers API is running 🎆",
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/discount", discountRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/fcm", fcmRoutes);

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 V Crackers Server running on port ${PORT}`);
});
