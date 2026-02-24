import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tag, Calendar, Layout } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  expiresAt: "",
  isActive: true,
  // Banner fields
  title: "",
  description: "",
  isFeatured: false,
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
      minOrderValue: c.minOrderValue || "",
      maxDiscount: c.maxDiscount || "",
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
      isActive: c.isActive,
      title: c.title || "",
      description: c.description || "",
      isFeatured: c.isFeatured || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue || !form.expiresAt) {
      toast.error("Code, discount value and expiry date are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        expiresAt: form.expiresAt,
        isActive: form.isActive,
        title: form.title,
        description: form.description,
        isFeatured: form.isFeatured,
      };
      if (editing) {
        await api.put(`/coupons/${editing._id}`, payload);
        toast.success("Coupon updated!");
      } else {
        await api.post("/coupons", payload);
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
              className={`card-admin p-5 border-l-4 ${
                !c.isActive || isExpired(c.expiresAt)
                  ? "border-red-300 opacity-60"
                  : c.isFeatured
                    ? "border-yellow-400"
                    : "border-primary"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono font-bold text-gray-900 tracking-wider">
                    {c.code}
                  </span>
                  {c.isFeatured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <Layout className="w-2.5 h-2.5" /> Banner
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
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

              {c.title && (
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {c.title}
                </p>
              )}

              <div className="space-y-1 text-xs text-gray-500">
                {c.minOrderValue > 0 && <p>Min order: ₹{c.minOrderValue}</p>}
                {c.maxDiscount > 0 && <p>Max discount: ₹{c.maxDiscount}</p>}
                {c.expiresAt && (
                  <p
                    className={`flex items-center gap-1 ${
                      isExpired(c.expiresAt) ? "text-red-600 font-semibold" : ""
                    }`}
                  >
                    <Calendar className="w-3 h-3" />{" "}
                    {isExpired(c.expiresAt) ? "Expired " : "Expires "}
                    {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>

              <div className="mt-3">
                <span
                  className={
                    c.isActive && !isExpired(c.expiresAt)
                      ? "badge-active"
                      : "badge-inactive"
                  }
                >
                  {c.isActive && !isExpired(c.expiresAt)
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

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl z-10 max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-4">
              {/* Coupon basics */}
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
                    placeholder={
                      form.discountType === "percentage" ? "50" : "200"
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) =>
                      setForm({ ...form, minOrderValue: e.target.value })
                    }
                    className="input-admin"
                    placeholder="500"
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
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Expiry Date / Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm({ ...form, expiresAt: e.target.value })
                    }
                    className="input-admin"
                  />
                </div>
              </div>

              {/* Divider + Banner section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" /> Homepage Banner
                    (Optional)
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm({ ...form, isFeatured: e.target.checked })
                      }
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      Show as homepage banner
                    </span>
                  </label>
                </div>

                {form.isFeatured && (
                  <div className="space-y-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs text-yellow-700 font-medium">
                      ✨ This coupon will appear as the featured discount banner
                      on the homepage.
                    </p>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                        Banner Title
                      </label>
                      <input
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className="input-admin"
                        placeholder="e.g. Mega Diwali Sale"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                        Banner Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="input-admin resize-none"
                        rows={2}
                        placeholder="e.g. On all combo gift boxes. Celebrate more, spend less this festival of lights."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
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
