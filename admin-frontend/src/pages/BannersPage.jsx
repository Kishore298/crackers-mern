import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload, GripVertical } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const EMPTY_FORM = { title: "", link: "", order: 0, isActive: true };

const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get("/banners/admin");
      setBanners(data.banners || []);
    } catch {
      try {
        const { data } = await api.get("/banners");
        setBanners(data.banners || []);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setShowModal(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title: b.title || "",
      link: b.link || "",
      order: b.order || 0,
      isActive: b.isActive,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing && !imageFile) {
      toast.error("Banner image is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editing) {
        await api.put(`/banners/${editing._id}`, fd, config);
        toast.success("Banner updated!");
      } else {
        await api.post("/banners", fd, config);
        toast.success("Banner created!");
      }
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete banner?")) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success("Deleted!");
      fetchBanners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const toggleActive = async (b) => {
    try {
      const fd = new FormData();
      fd.append("isActive", !b.isActive);
      fd.append("title", b.title || "");
      await api.put(`/banners/${b._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchBanners();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Banners{" "}
          <span className="text-gray-400 font-normal text-base">
            ({banners.length})
          </span>
        </h2>
        <button onClick={openAdd} className="btn-fire text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b._id}
              className="card-admin p-4 flex items-center gap-4 group hover:border-orange-200 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
              <div className="w-32 h-20 rounded-xl overflow-hidden bg-surface shrink-0">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-gray-900">
                  {b.title || "Untitled Banner"}
                </p>
                {b.link && (
                  <p className="text-xs text-primary truncate mt-0.5">
                    {b.link}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Order: {b.order}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${b.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {b.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="card-admin py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="font-semibold">No banners yet</p>
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
                {editing ? "Edit Banner" : "Add Banner"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Banner Image {!editing && "*"}
                </label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt=""
                      className="w-full h-28 rounded-lg object-cover"
                    />
                  ) : editing?.imageUrl ? (
                    <>
                      <img
                        src={editing.imageUrl}
                        alt=""
                        className="w-full h-28 rounded-lg object-cover"
                      />
                      <span className="text-xs text-gray-400">
                        Click to change
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-200" />
                      <span className="text-xs text-gray-400">
                        Click to upload banner image
                        <br />
                        <span className="text-gray-300">
                          Recommended: 1200×400px
                        </span>
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-admin"
                  placeholder="Festival Sale Banner"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Link URL
                </label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="input-admin"
                  placeholder="/products?category=rockets"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm({ ...form, order: e.target.value })
                    }
                    className="input-admin"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="isActiveBanner"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <label
                    htmlFor="isActiveBanner"
                    className="text-xs font-semibold text-gray-600"
                  >
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-fire flex-1 justify-center py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update" : "Upload"}
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

export default BannersPage;
