import { useState, useEffect } from "react";
import { api } from "../context/AdminAuthContext";
import { toast } from "react-hot-toast";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    packagingChargeEnabled: true,
    packagingChargePercentage: 2,
    googleReviewUrl: "",
    minOrderAmount: 4000,
    onlineOrdersOpen: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");
      if (res.data.success && res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/settings", { settings });
      if (res.data.success) {
        toast.success("Settings updated successfully");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">

        {/* Online Orders Status */}
        <div className="card-admin p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🟢 Store Status</h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${settings.onlineOrdersOpen ? "text-green-600" : "text-red-600"}`}>
                {settings.onlineOrdersOpen ? "Open for Orders" : "Closed"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="onlineOrdersOpen"
              checked={settings.onlineOrdersOpen}
              onChange={(e) => setSettings({ ...settings, onlineOrdersOpen: e.target.checked })}
              className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="onlineOrdersOpen" className="ml-2 text-sm font-medium text-gray-700">
              Enable Online Ordering
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            If disabled, customers will see a "Store Closed" page instead of the website and won't be able to place online orders.
          </p>
        </div>

        {/* Minimum Order Amount */}
        <div className="card-admin p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🛒 Minimum Order Amount</h2>
          
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Cart Value (₹)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={settings.minOrderAmount}
              onChange={(e) => setSettings({ ...settings, minOrderAmount: parseInt(e.target.value) || 0 })}
              className="input-admin w-full sm:w-1/2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customers will not be able to checkout if their cart subtotal is below this amount.
            </p>
          </div>
        </div>

        {/* Packaging Charges */}
        <div className="card-admin p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Packaging Charges</h2>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="packagingEnabled"
              checked={settings.packagingChargeEnabled}
              onChange={(e) => setSettings({ ...settings, packagingChargeEnabled: e.target.checked })}
              className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="packagingEnabled" className="ml-2 text-sm font-medium text-gray-700">
              Enable Packaging Charges on Checkout
            </label>
          </div>

          {settings.packagingChargeEnabled && (
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packaging Charge Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.packagingChargePercentage}
                onChange={(e) => setSettings({ ...settings, packagingChargePercentage: parseFloat(e.target.value) || 0 })}
                className="input-admin w-full sm:w-1/2"
              />
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be applied to the order subtotal after discounts.
              </p>
            </div>
          )}
        </div>

        {/* Google Reviews */}
        <div className="card-admin p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⭐ Google Reviews</h2>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Review URL
            </label>
            <input
              type="url"
              placeholder="https://g.page/r/YOUR_BUSINESS/review"
              value={settings.googleReviewUrl || ""}
              onChange={(e) => setSettings({ ...settings, googleReviewUrl: e.target.value })}
              className="input-admin w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste your Google Business Profile review link here. This link will be shared with customers via WhatsApp and displayed on the website.
            </p>
          </div>

          {settings.googleReviewUrl && (
            <a
              href={settings.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-orange-400 mt-2"
            >
              🔗 Test Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
