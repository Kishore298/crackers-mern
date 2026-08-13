import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import ConfirmModal from "../components/ConfirmModal";

const ProfilePage = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, loading: false });

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/profile");
      return;
    }
    const fetch = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        setAddresses(data.user.addresses || []);
        setProfile({ name: data.user.name, phone: data.user.phone });
      } catch {}
    };
    fetch();
  }, [user, navigate]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/auth/profile", profile);
      await refreshProfile();
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingProfile(false);
    }
  };

  const addrFields = [
    { id: "fullName", label: "Full Name" },
    { id: "email", label: "Email", type: "email" },
    { id: "phone", label: "Phone" },
    { id: "addressLine1", label: "Address Line 1" },
    { id: "addressLine2", label: "Address Line 2 (optional)" },
    { id: "city", label: "City" },
    { id: "state", label: "State" },
    { id: "pincode", label: "Pincode" },
  ];

  const saveAddress = async () => {
    try {
      let data;
      if (editingAddr) {
        ({ data } = await api.put(`/auth/address/${editingAddr}`, addrForm));
      } else {
        ({ data } = await api.post("/auth/address", addrForm));
      }
      setAddresses(data.addresses);
      setShowAddAddr(false);
      setEditingAddr(null);
      setAddrForm({
        fullName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
      toast.success(editingAddr ? "Address updated!" : "Address added!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const deleteAddress = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setConfirmDelete({ ...confirmDelete, loading: true });
    try {
      const { data } = await api.delete(`/auth/address/${id}`);
      setAddresses(data.addresses);
      toast.success("Address deleted");
      setConfirmDelete({ open: false, id: null, loading: false });
    } catch {
      toast.error("Failed to delete");
      setConfirmDelete({ ...confirmDelete, loading: false });
    }
  };

  return (
    <div className="min-h-screen py-8 animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="My Profile" noindex={true} />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 space-y-6">
        {/* Profile */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
          <h2 className="font-heading font-semibold text-lg text-white mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile Details
          </h2>
          <form
            onSubmit={saveProfile}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Full Name
              </label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="input-fire"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Phone
              </label>
              <input
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="input-fire"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Email (cannot change)
              </label>
              <input
                value={user?.email || ""}
                disabled
                className="input-fire opacity-60"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 mt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-fire px-6 py-2.5 rounded-xl text-sm"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-6 py-2.5 rounded-xl text-sm border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          </form>
        </div>

        {/* Addresses */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Saved Addresses
            </h2>
            <button
              onClick={() => {
                setShowAddAddr(true);
                setEditingAddr(null);
                setAddrForm({
                  fullName: "",
                  phone: "",
                  addressLine1: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  pincode: "",
                  isDefault: false,
                });
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="flex items-start gap-3 p-4 rounded-xl border border-transparent transition-colors hover:border-primary-light"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-1.5 flex flex-col gap-0.5">
                    <span className="font-semibold text-white">{addr.fullName}</span>
                    {addr.email && <span className="text-xs text-gray-400">{addr.email}</span>}
                    <span>{addr.phone}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""},{" "}
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                  {addr.isDefault && (
                    <span className="badge-fire text-xs mt-1.5 inline-block">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingAddr(addr._id);
                      setAddrForm({
                        fullName: addr.fullName,
                        email: addr.email || "",
                        phone: addr.phone,
                        addressLine1: addr.addressLine1,
                        addressLine2: addr.addressLine2 || "",
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        isDefault: addr.isDefault,
                      });
                      setShowAddAddr(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ open: true, id: addr._id, loading: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No saved addresses yet
              </p>
            )}
          </div>

          {showAddAddr && (
            <div className="mt-4 p-4 rounded-xl grid grid-cols-2 gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h3 className="col-span-2 font-semibold text-sm text-gray-300">
                {editingAddr ? "Edit Address" : "New Address"}
              </h3>
              {addrFields.map((field) => (
                <div
                  key={field.id}
                  className={
                    field.id === "addressLine1" || field.id === "addressLine2"
                      ? "col-span-2"
                      : ""
                  }
                >
                  <label className="text-xs font-semibold text-gray-400 block mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={addrForm[field.id]}
                    onChange={(e) =>
                      setAddrForm({ ...addrForm, [field.id]: e.target.value })
                    }
                    className="input-fire text-sm py-2"
                  />
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addrForm.isDefault}
                  onChange={(e) =>
                    setAddrForm({ ...addrForm, isDefault: e.target.checked })
                  }
                  className="accent-primary"
                />
                <label
                  htmlFor="isDefault"
                  className="text-xs font-semibold text-gray-400"
                >
                  Set as default address
                </label>
              </div>
              <div className="col-span-2 flex gap-3 mt-2">
                <button
                  onClick={saveAddress}
                  className="btn-fire px-5 py-2 text-sm rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddAddr(false);
                    setEditingAddr(null);
                  }}
                  className="px-5 py-2 text-sm text-gray-400 rounded-lg hover:bg-surface-2 transition-colors"
                  style={{ border: "1px solid rgba(255,102,0,0.1)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
      
      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, loading: false })}
        onConfirm={deleteAddress}
        title="Delete Address"
        message="Are you sure you want to delete this address? It will be removed from your saved list."
        confirmText="Delete"
        loading={confirmDelete.loading}
      />
    </div>
  );
};

export default ProfilePage;
