const User = require("../models/User");
const Sale = require("../models/Sale");

// GET /api/users — list all customers (admin)
const getAllUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { role: "customer" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email phone isActive createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    // Get order stats for each user in one aggregate query
    const userIds = users.map((u) => u._id);
    const orderStats = await Sale.aggregate([
      { $match: { customer: { $in: userIds }, paymentStatus: "paid" } },
      {
        $group: {
          _id: "$customer",
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: "$finalPayable" },
          lastOrder: { $max: "$createdAt" },
        },
      },
    ]);

    const statsMap = {};
    orderStats.forEach((s) => {
      statsMap[s._id.toString()] = s;
    });

    const enriched = users.map((u) => {
      const stats = statsMap[u._id.toString()] || {};
      return {
        ...u.toObject(),
        totalOrders: stats.totalOrders || 0,
        totalSpend: stats.totalSpend || 0,
        lastOrder: stats.lastOrder || null,
      };
    });

    res.json({ success: true, users: enriched, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id — full profile + order history
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email phone isActive createdAt addresses",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // All orders (online by customer ref, offline by billingInfo.phone match)
    const onlineOrders = await Sale.find({ customer: user._id })
      .select(
        "invoiceNo saleType orderStatus paymentStatus finalPayable createdAt items billingInfo shippingAddress paymentMethod",
      )
      .sort({ createdAt: -1 });

    // If user has a phone, also search offline (POS) orders by phone
    let offlineOrders = [];
    if (user.phone) {
      offlineOrders = await Sale.find({
        saleType: "offline",
        customer: null,
        "billingInfo.phone": user.phone,
      })
        .select(
          "invoiceNo saleType orderStatus paymentStatus finalPayable createdAt items billingInfo paymentMethod",
        )
        .sort({ createdAt: -1 });
    }

    const allOrders = [...onlineOrders, ...offlineOrders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    const totalSpend = allOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.finalPayable, 0);

    res.json({
      success: true,
      user,
      orders: allOrders,
      stats: {
        totalOrders: allOrders.length,
        totalSpend,
        lastOrder: allOrders[0]?.createdAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id/toggle-status — block/unblock
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.role === "admin")
      return res
        .status(403)
        .json({ success: false, message: "Cannot modify admin accounts" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      isActive: user.isActive,
      message: user.isActive ? "Customer unblocked" : "Customer blocked",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllUsers, getUserDetail, toggleUserStatus };
