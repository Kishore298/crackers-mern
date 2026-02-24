import React, { useEffect, useState } from "react";
import { Percent, Save, Trash2, CheckCircle } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const DiscountPage = () => {
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDiscount = async () => {
    try {
      const { data } = await api.get("/discount");
      if (data.discount) {
        setDiscount(data.discount);
        setPercentage(data.discount.percentage);
        setLabel(data.discount.label || "");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, []);

  const handleSave = async () => {
    const pct = Number(percentage);
    if (!percentage || isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a valid percentage (0–100)");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/discount", {
        percentage: pct,
        label: label || "Sale",
        isActive: true,
      });
      setDiscount(data.discount);
      toast.success("Discount applied to all products!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm("Remove the sitewide discount?")) return;
    try {
      await api.delete("/discount");
      setDiscount(null);
      setPercentage("");
      setLabel("");
      toast.success("Discount removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="max-w-lg">
      {/* Current status */}
      {discount?.isActive ? (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-6 border border-green-200"
          style={{ background: "#F0FDF4" }}
        >
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">
              Active —{" "}
              <span className="font-black">{discount.percentage}% OFF</span>{" "}
              sitewide ({discount.label})
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              All product prices are displayed with this discount applied.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 border border-gray-200 bg-gray-50">
          <Percent className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            No sitewide discount is currently active.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="card-admin p-6">
        <h3 className="font-heading font-bold text-gray-900 mb-1">
          Set Sitewide Discount
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          This percentage will be shown as the sale discount on every product
          across the website.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Discount Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="input-admin pr-10 text-2xl font-bold"
                placeholder="e.g. 20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                %
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Sale Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input-admin"
              placeholder="e.g. Diwali Sale"
            />
          </div>
        </div>

        {/* Preview */}
        {percentage > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-orange-50 border border-orange-100 text-sm">
            <p className="text-gray-500 text-xs mb-1">Preview</p>
            <p className="font-semibold text-gray-800">
              ₹1000 product →{" "}
              <span className="line-through text-gray-400">₹1000</span>{" "}
              <span className="text-primary font-black text-base">
                ₹{Math.round(1000 * (1 - percentage / 100))}
              </span>{" "}
              <span className="text-xs text-green-600 font-bold">
                ({percentage}% OFF)
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-fire flex-1 justify-center py-2.5 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Apply Discount"}
          </button>
          {discount?.isActive && (
            <button
              onClick={handleDisable}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountPage;
