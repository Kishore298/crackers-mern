const Sale = require("../models/Sale");
const Product = require("../models/Product");
const User = require("../models/User");

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const [totalOrders, pendingOrders, totalUsers] = await Promise.all([
      Sale.countDocuments(),
      Sale.countDocuments({ orderStatus: "processing" }),
      User.countDocuments({ role: "customer" }),
    ]);

    // Revenue aggregations
    const revenueAgg = await Sale.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: "$saleType",
          total: { $sum: "$finalPayable" },
          count: { $sum: 1 },
        },
      },
    ]);

    const onlineRevenue =
      revenueAgg.find((r) => r._id === "online")?.total || 0;
    const offlineRevenue =
      revenueAgg.find((r) => r._id === "offline")?.total || 0;

    // Today revenue
    const todayRevenue = await Sale.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: "$finalPayable" } } },
    ]);

    // This month revenue
    const monthRevenue = await Sale.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$finalPayable" } } },
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    // Low stock products
    const lowStock = await Product.find({ stock: { $lte: 10 }, isActive: true })
      .select("name stock")
      .sort({ stock: 1 })
      .limit(10);

    // Daily sales for last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailySales = await Sale.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          revenue: { $sum: "$finalPayable" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyRevenue = await Sale.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$finalPayable" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalUsers,
        onlineRevenue,
        offlineRevenue,
        totalRevenue: onlineRevenue + offlineRevenue,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        topProducts,
        lowStock,
        dailySales,
        monthlyRevenue,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/reports
const getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const matchFilter = { paymentStatus: "paid" };

    if (from || to) {
      matchFilter.createdAt = {};
      if (from) matchFilter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const [salesByType, salesByCategory] = await Promise.all([
      Sale.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$saleType",
            count: { $sum: 1 },
            revenue: { $sum: "$finalPayable" },
          },
        },
      ]),
      Sale.aggregate([
        { $match: matchFilter },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$categoryInfo._id",
            name: { $first: "$categoryInfo.name" },
            revenue: { $sum: "$items.subtotal" },
            unitsSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    res.json({ success: true, salesByType, salesByCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getReports };
