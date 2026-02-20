import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../context/AdminAuthContext";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card-admin p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: color + "20" }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-heading font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/analytics/dashboard");
        setStats(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${(stats?.revenue || 0).toLocaleString()}`}
          sub="All time"
          color="#FF4500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats?.orders || 0}
          sub="This month"
          color="#6366F1"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats?.products || 0}
          sub="Active listings"
          color="#10B981"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats?.lowStock || 0}
          sub="Below threshold"
          color="#F59E0B"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-admin p-5">
          <h3 className="font-heading font-semibold text-sm text-gray-700 mb-5">
            Revenue (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.revenueChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#FF4500"
                strokeWidth={2.5}
                dot={{ fill: "#FF4500", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-admin p-5">
          <h3 className="font-heading font-semibold text-sm text-gray-700 mb-5">
            Orders (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.ordersChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="card-admin p-5">
        <h3 className="font-heading font-semibold text-sm text-gray-700 mb-4">
          Top Selling Products
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Product", "Units Sold", "Revenue"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.topProducts || []).map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-3 font-medium text-gray-800">
                    {p.name}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{p.totalQty}</td>
                  <td className="py-3 px-3 font-semibold text-primary">
                    ₹{(p.totalRevenue || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!stats?.topProducts?.length && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">
                    No data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {(stats?.lowStockItems || []).length > 0 && (
        <div className="card-admin p-5 border-l-4 border-amber-400">
          <h3 className="font-heading font-semibold text-sm text-amber-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockItems.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center bg-amber-50 rounded-xl px-4 py-3 text-sm"
              >
                <span className="font-medium text-gray-800 truncate">
                  {item.name}
                </span>
                <span className="shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-800">
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
