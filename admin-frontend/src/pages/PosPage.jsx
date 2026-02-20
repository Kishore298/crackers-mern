import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Loader,
  Trash2,
} from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const PosPage = () => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [billing, setBilling] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  const searchProducts = async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/products?search=${q}&limit=8`);
      setSearchResults(data.products || []);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing)
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, qty: Math.min(i.qty + 1, product.stock) }
            : i,
        );
      return [...prev, { ...product, qty: 1 }];
    });
    setSearch("");
    setSearchResults([]);
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((c) => c.filter((i) => i._id !== id));
      return;
    }
    setCart((c) => c.map((i) => (i._id === id ? { ...i, qty } : i)));
  };

  const total = cart.reduce(
    (sum, item) => sum + (item.discountedPrice || item.price) * item.qty,
    0,
  );

  const handleBill = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    setBilling(true);
    try {
      const { data } = await api.post("/pos/bill", {
        items: cart.map((i) => ({
          product: i._id,
          quantity: i.qty,
          name: i.name,
          price: i.discountedPrice || i.price,
        })),
        customerName,
        customerPhone,
        paymentMethod,
        totalAmount: total,
      });
      setLastBill(data.sale);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      toast.success("Bill generated! 🎆");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Billing failed");
    } finally {
      setBilling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card-admin p-5">
          <h3 className="font-heading font-semibold text-base text-gray-900 mb-4">
            Search Products
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Search by product name..."
              className="input-admin pl-10"
            />
          </div>
          {searching && (
            <p className="text-xs text-gray-400 mt-2">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {searchResults.map((p) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface text-left transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🎆"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">Stock: {p.stock}</p>
                  </div>
                  <span className="font-bold text-primary shrink-0">
                    ₹{p.discountedPrice || p.price}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card-admin p-5">
          <h3 className="font-heading font-semibold text-base text-gray-900 mb-4">
            Cart Items{" "}
            {cart.length > 0 && (
              <span className="text-primary">({cart.length})</span>
            )}
          </h3>
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-orange-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-primary font-bold mt-0.5">
                      ₹{(item.discountedPrice || item.price) * item.qty}
                    </p>
                  </div>
                  <div className="flex items-center border border-orange-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQty(item._id, item.qty - 1)}
                      className="px-2 py-1.5 hover:bg-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <span className="px-3 text-sm font-bold text-gray-900 border-x border-orange-100">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item._id, item.qty + 1)}
                      disabled={item.qty >= item.stock}
                      className="px-2 py-1.5 hover:bg-white transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setCart((c) => c.filter((i) => i._id !== item._id))
                    }
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Billing Panel */}
      <div className="space-y-4">
        <div className="card-admin p-5">
          <h3 className="font-heading font-semibold text-base text-gray-900 mb-4">
            Customer Info
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Customer Name *
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-admin"
                placeholder="Walk-in Customer"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Phone (optional)
              </label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input-admin"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-admin"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-admin p-5">
          <div className="space-y-2 text-sm mb-4">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex justify-between text-gray-600"
              >
                <span className="truncate max-w-[120px]">
                  {item.name} ×{item.qty}
                </span>
                <span className="font-semibold">
                  ₹{(item.discountedPrice || item.price) * item.qty}
                </span>
              </div>
            ))}
            <div className="border-t border-orange-100 pt-2 flex justify-between font-heading font-bold text-gray-900">
              <span>Total</span>
              <span className="text-primary text-lg">₹{total}</span>
            </div>
          </div>
          <button
            onClick={handleBill}
            disabled={billing || cart.length === 0}
            className="btn-fire w-full justify-center py-3 rounded-xl disabled:opacity-50"
          >
            {billing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate Bill"
            )}
          </button>
        </div>

        {lastBill && (
          <div className="card-admin p-5 border-l-4 border-green-400">
            <p className="font-heading font-bold text-sm text-green-700 mb-1">
              Bill Generated! ✅
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {lastBill.invoiceNo}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              ₹{lastBill.finalPayable} · {lastBill.paymentMethod?.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosPage;
