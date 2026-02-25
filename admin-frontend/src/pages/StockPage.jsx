import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const TYPE_COLORS = {
  sale: "badge-inactive",
  restock: "badge-active",
  correction: "badge-warning",
};

const StockPage = () => {
  const [ledger, setLedger] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showRestock, setShowRestock] = useState(false);
  const [products, setProducts] = useState([]);
  const [restockForm, setRestockForm] = useState({
    product: "",
    qty: "",
    reference: "",
  });
  const [restockType, setRestockType] = useState("restock");

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/stock?page=${page}&limit=20`);
      setLedger(data.entries || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);
  useEffect(() => {
    api
      .get("/products?limit=200")
      .then((r) => setProducts(r.data.products || []))
      .catch(() => {});
  }, []);

  const handleRestock = async () => {
    if (!restockForm.product || !restockForm.qty) {
      toast.error("Product and quantity required");
      return;
    }
    try {
      if (restockType === "restock") {
        await api.post(`/stock/${restockForm.product}/restock`, {
          quantity: Number(restockForm.qty),
          reference: restockForm.reference,
        });
      } else {
        await api.put(`/stock/${restockForm.product}/correct`, {
          newStock: Number(restockForm.qty),
          reason: restockForm.reference,
        });
      }
      toast.success(
        restockType === "restock" ? "Stock restocked!" : "Stock corrected!",
      );
      setShowRestock(false);
      setRestockForm({ product: "", qty: "", reference: "" });
      fetchLedger();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Stock Ledger{" "}
          <span className="text-gray-400 font-normal text-base">
            ({total} entries)
          </span>
        </h2>
        <button
          onClick={() => setShowRestock(true)}
          className="btn-fire text-sm px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Restock / Correct
        </button>
      </div>

      <div className="card-admin overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[
                "Product",
                "Type",
                "Qty Change",
                "Stock After",
                "Reference",
                "Date",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin mx-auto" />
                </td>
              </tr>
            ) : (
              ledger.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {entry.product?.name || "Deleted product"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={TYPE_COLORS[entry.type] || "badge-gray"}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${entry.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {entry.quantityChange > 0 ? "+" : ""}
                      {entry.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">
                    {entry.stockAfter}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {entry.reference || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
            {!loading && ledger.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  No stock entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-50">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold ${page === pg ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={
                  page === pg
                    ? { background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" }
                    : {}
                }
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRestock(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-5">
              Restock / Correct Stock
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Action Type
                </label>
                <div className="flex gap-2">
                  {["restock", "correction"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setRestockType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${restockType === t ? "border-primary text-primary bg-surface" : "border-gray-200 text-gray-500"}`}
                    >
                      {t === "restock" ? "📦 Restock" : "🔧 Correction"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Product *
                </label>
                <select
                  value={restockForm.product}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, product: e.target.value })
                  }
                  className="input-admin"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  {restockType === "restock"
                    ? "Quantity to Add *"
                    : "New Stock Value *"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockForm.qty}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, qty: e.target.value })
                  }
                  className="input-admin"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Reference / Reason
                </label>
                <input
                  value={restockForm.reference}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      reference: e.target.value,
                    })
                  }
                  className="input-admin"
                  placeholder="PO-12345 or Damage write-off"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRestock}
                className="btn-fire flex-1 justify-center py-2.5 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />{" "}
                {restockType === "restock" ? "Restock" : "Correct"}
              </button>
              <button
                onClick={() => setShowRestock(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
