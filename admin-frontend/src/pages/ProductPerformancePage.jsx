import React, { useState, useEffect, useCallback } from "react";
import { BarChart2, Search, Download, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { useAdminAuth, api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const ProductPerformancePage = () => {
  const { admin } = useAdminAuth();
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    sort: "revenue",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      params.set("limit", "100");

      const { data } = await api.get(`/analytics/product-performance?${params}`);
      if (data.success) {
        setData(data.products);
        setTotal(data.total);
      }
    } catch (err) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.get("/categories")
      .then((r) => r.data.success && setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const exportCsv = () => {
    const headers = ["#", "Product", "Category", "Qty Sold", "Revenue (₹)", "Stock Left", "Status"];
    const rows = data.map((p, i) => [
      i + 1,
      `"${p.name}"`,
      `"${p.category?.name || "N/A"}"`,
      p.totalQtySold,
      p.totalRevenue,
      p.stock,
      p.isActive ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = data.reduce((s, p) => s + p.totalRevenue, 0);
  const totalQty = data.reduce((s, p) => s + p.totalQtySold, 0);
  const lowStock = data.filter((p) => p.stock < 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
            <p className="text-sm text-gray-500">Sales data per product across all orders</p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Total Qty Sold", value: totalQty.toLocaleString(), icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Low Stock Products", value: lowStock, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="revenue">Sort: Revenue ↓</option>
            <option value="qty">Sort: Qty Sold ↓</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ search: "", category: "", dateFrom: "", dateTo: "", sort: "revenue" })}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qty Sold</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Left</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-8 h-8 border-2 border-orange-200 border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">No products found.</td>
                </tr>
              ) : (
                data.map((p, i) => (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url && (
                          <img src={p.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{p.totalQtySold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-700">₹{p.totalRevenue.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block text-sm font-bold px-2 py-0.5 rounded-lg ${p.stock < 10 ? "bg-red-50 text-red-600" : p.stock < 30 ? "bg-amber-50 text-amber-700" : "text-gray-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && data.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
            Showing {data.length} of {total} products
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPerformancePage;
