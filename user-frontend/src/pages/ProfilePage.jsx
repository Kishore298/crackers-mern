import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

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

  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const { data } = await api.delete(`/auth/address/${id}`);
      setAddresses(data.addresses);
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-orange-100 p-6">
          <h2 className="font-heading font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile Details
          </h2>
          <form
            onSubmit={saveProfile}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email (cannot change)
              </label>
              <input
                value={user?.email || ""}
                disabled
                className="input-fire opacity-60"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
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
                className="px-6 py-2.5 rounded-xl text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          </form>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl border border-orange-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-gray-900 flex items-center gap-2">
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
                className="flex items-start gap-3 p-4 rounded-xl border border-orange-100 bg-surface"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {addr.fullName} · {addr.phone}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
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
                    onClick={() => deleteAddress(addr._id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
            <div className="mt-4 p-4 bg-surface rounded-xl border border-orange-100 grid grid-cols-2 gap-3">
              <h3 className="col-span-2 font-semibold text-sm text-gray-800">
                {editingAddr ? "Edit Address" : "New Address"}
              </h3>
              {addrFields.map(({ id, label }) => (
                <div
                  key={id}
                  className={
                    id === "addressLine1" || id === "addressLine2"
                      ? "col-span-2"
                      : ""
                  }
                >
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    {label}
                  </label>
                  <input
                    value={addrForm[id]}
                    onChange={(e) =>
                      setAddrForm({ ...addrForm, [id]: e.target.value })
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
                  className="text-xs font-semibold text-gray-600"
                >
                  Set as default address
                </label>
              </div>
              <div className="col-span-2 flex gap-3">
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
                  className="px-5 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white w-full rounded-2xl border border-orange-100 p-6">
          <h2 className="font-heading font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Change Password
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (pwdForm.newPassword !== pwdForm.confirm)
                return toast.error("Passwords do not match");
              if (pwdForm.newPassword.length < 6)
                return toast.error("Min 6 characters");
              setSavingPwd(true);
              try {
                await api.put("/auth/change-password", {
                  currentPassword: pwdForm.currentPassword,
                  newPassword: pwdForm.newPassword,
                });
                toast.success("Password changed!");
                setPwdForm({
                  currentPassword: "",
                  newPassword: "",
                  confirm: "",
                });
              } catch (err) {
                toast.error(err?.response?.data?.message || "Failed");
              } finally {
                setSavingPwd(false);
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Current Password
              </label>
              <input
                type={showPwd ? "text" : "password"}
                required
                value={pwdForm.currentPassword}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, currentPassword: e.target.value })
                }
                className="input-fire pr-10"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                New Password
              </label>
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                value={pwdForm.newPassword}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, newPassword: e.target.value })
                }
                className="input-fire"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPwd ? "text" : "password"}
                required
                value={pwdForm.confirm}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, confirm: e.target.value })
                }
                className="input-fire"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-4">
              <button
                type="submit"
                disabled={savingPwd}
                className="btn-fire px-6 py-2.5 rounded-xl text-sm"
              >
                {savingPwd ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
              >
                {showPwd ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showPwd ? "Hide" : "Show"} passwords
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
