import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tag, Calendar } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrder: "",
  maxDiscount: "",
  expiryDate: "",
  isActive: true,
};

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get("/coupons");
      setCoupons(data.coupons || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrder: c.minOrder || "",
      maxDiscount: c.maxDiscount || "",
      expiryDate: c.expiryDate ? c.expiryDate.split("T")[0] : "",
      isActive: c.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) {
      toast.error("Code and discount value required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/coupons/${editing._id}`, form);
        toast.success("Coupon updated!");
      } else {
        await api.post("/coupons", form);
        toast.success("Coupon created!");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Deleted!");
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const isExpired = (exp) => exp && new Date(exp) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Coupons{" "}
          <span className="text-gray-400 font-normal text-base">
            ({coupons.length})
          </span>
        </h2>
        <button onClick={openAdd} className="btn-fire text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c._id}
              className={`card-admin p-5 border-l-4 ${!c.isActive || isExpired(c.expiryDate) ? "border-red-300 opacity-60" : "border-primary"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-gray-900 tracking-wider">
                    {c.code}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-heading font-bold text-primary mb-1">
                {c.discountType === "percentage"
                  ? `${c.discountValue}% OFF`
                  : `₹${c.discountValue} OFF`}
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                {c.minOrder > 0 && <p>Min order: ₹{c.minOrder}</p>}
                {c.maxDiscount > 0 && <p>Max discount: ₹{c.maxDiscount}</p>}
                {c.expiryDate && (
                  <p
                    className={`flex items-center gap-1 ${isExpired(c.expiryDate) ? "text-red-600 font-semibold" : ""}`}
                  >
                    <Calendar className="w-3 h-3" />{" "}
                    {isExpired(c.expiryDate) ? "Expired " : "Expires "}
                    {new Date(c.expiryDate).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <span
                  className={
                    c.isActive && !isExpired(c.expiryDate)
                      ? "badge-active"
                      : "badge-inactive"
                  }
                >
                  {c.isActive && !isExpired(c.expiryDate)
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="font-semibold">No coupons yet</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {editing ? "Edit Coupon" : "Add Coupon"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Coupon Code *
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="input-admin font-mono"
                  placeholder="DIWALI2026"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value })
                  }
                  className="input-admin"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Value *
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  className="input-admin"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm({ ...form, minOrder: e.target.value })
                  }
                  className="input-admin"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscount: e.target.value })
                  }
                  className="input-admin"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                  className="input-admin"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isActiveCoupon"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="accent-primary"
                />
                <label
                  htmlFor="isActiveCoupon"
                  className="text-xs font-semibold text-gray-600"
                >
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-fire flex-1 justify-center py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              <button
                onClick={() => setShowModal(false)}
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

export default CouponsPage;
