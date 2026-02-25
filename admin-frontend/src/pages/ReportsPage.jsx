import React, { useState } from "react";
import { Download, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const COLORS = [
  "#ff6600",
  "#ff6600",
  "#ffcc33",
  "#6366F1",
  "#10B981",
  "#F59E0B",
];

const ReportsPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Select date range");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(
        `/analytics/report?startDate=${startDate}&endDate=${endDate}`,
      );
      setReport(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-gray-900">
        Sales Reports
      </h2>

      {/* Date Range Picker */}
      <div className="card-admin p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-admin pl-10 w-40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-admin pl-10 w-40"
              />
            </div>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="btn-fire px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: "Today", days: 0 },
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - days);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(today);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface text-primary hover:bg-surface-2 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Revenue",
                value: `₹${(report.totalRevenue || 0).toLocaleString()}`,
              },
              { label: "Total Orders", value: report.totalOrders || 0 },
              { label: "Online Orders", value: report.onlineOrders || 0 },
              { label: "Offline Orders", value: report.offlineOrders || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="card-admin p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {label}
                </p>
                <p className="text-2xl font-heading font-bold text-primary">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          {report.dailyData?.length > 0 && (
            <div className="card-admin p-5">
              <h3 className="font-heading font-semibold text-sm text-gray-700 mb-5">
                Daily Revenue
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#ff6600" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top products + Channel split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {report.topProducts?.length > 0 && (
              <div className="card-admin p-5">
                <h3 className="font-heading font-semibold text-sm text-gray-700 mb-4">
                  Top Products
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Product", "Units", "Revenue"].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-2 text-xs font-semibold text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 px-2 font-medium text-gray-800 text-xs">
                          {p.name}
                        </td>
                        <td className="py-2 px-2 text-gray-600 text-xs">
                          {p.totalQty}
                        </td>
                        <td className="py-2 px-2 font-semibold text-primary text-xs">
                          ₹{(p.totalRevenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Online vs Offline pie */}
            <div className="card-admin p-5">
              <h3 className="font-heading font-semibold text-sm text-gray-700 mb-4">
                Sales Channel Split
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Online", value: report.onlineRevenue || 0 },
                      { name: "Offline", value: report.offlineRevenue || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                  >
                    {["Online", "Offline"].map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${(v || 0).toLocaleString()}`} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="card-admin py-20 text-center text-gray-400">
          <p className="text-5xl mb-4">📊</p>
          <p className="font-semibold text-lg text-gray-600 mb-2">
            Generate a Report
          </p>
          <p className="text-sm">
            Select a date range above and click "Generate Report"
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
