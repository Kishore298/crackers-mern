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

// GET /api/analytics/product-performance
const getProductPerformance = async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      category,
      search,
      sort = "revenue",
      page = 1,
      limit = 50,
    } = req.query;

    // Build date match for sales
    const dateMatch = {};
    if (dateFrom || dateTo) {
      dateMatch.createdAt = {};
      if (dateFrom) dateMatch.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateMatch.createdAt.$lte = end;
      }
    }

    // Aggregate sales by product
    const salesAgg = await Sale.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" }, ...dateMatch } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQtySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Map agg results by productId
    const salesMap = {};
    salesAgg.forEach((s) => {
      if (s._id) salesMap[s._id.toString()] = s;
    });

    // Build product filter
    const productFilter = { isActive: { $in: [true, false] } };
    if (category) productFilter.category = category;
    if (search) productFilter.name = { $regex: search, $options: "i" };

    const products = await Product.find(productFilter)
      .populate("category", "name")
      .select("name category stock isActive images price discountedPrice")
      .lean();

    // Merge sales data
    let enriched = products.map((p) => {
      const s = salesMap[p._id.toString()] || {};
      return {
        ...p,
        totalQtySold: s.totalQtySold || 0,
        totalRevenue: s.totalRevenue || 0,
        orderCount: s.orderCount || 0,
      };
    });

    // Sort
    const sortFn =
      sort === "qty"
        ? (a, b) => b.totalQtySold - a.totalQtySold
        : sort === "name"
          ? (a, b) => a.name.localeCompare(b.name)
          : (a, b) => b.totalRevenue - a.totalRevenue;

    enriched.sort(sortFn);

    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      products: paginated,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/analytics/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = { paymentStatus: "paid" };
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const [byType, dailyAgg, topProductsAgg] = await Promise.all([
      // Group by saleType: online / offline
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

      // Daily revenue for chart
      Sale.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$finalPayable" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
      ]),

      // Top 10 products in the date range
      Sale.aggregate([
        { $match: matchFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const online = byType.find((r) => r._id === "online") || { count: 0, revenue: 0 };
    const offline = byType.find((r) => r._id === "offline") || { count: 0, revenue: 0 };

    res.json({
      success: true,
      totalRevenue: online.revenue + offline.revenue,
      totalOrders: online.count + offline.count,
      onlineOrders: online.count,
      offlineOrders: offline.count,
      onlineRevenue: online.revenue,
      offlineRevenue: offline.revenue,
      dailyData: dailyAgg,
      topProducts: topProductsAgg,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getReports, getProductPerformance, getReport };