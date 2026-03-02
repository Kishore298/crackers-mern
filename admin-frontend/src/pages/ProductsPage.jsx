import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, Search, GripVertical } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  discountedPrice: "",
  stock: "",
  category: "",
  safetyInstructions: "",
  youtubeId: "",
  isActive: true,
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  // Existing images for reordering
  const [editingImages, setEditingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (activeFilter !== "") params.set("isActive", activeFilter);
      const { data } = await api.get(`/products/admin?${params}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      discountedPrice: p.discountedPrice || "",
      stock: p.stock,
      category: p.category?._id || "",
      safetyInstructions: p.safetyInstructions || "",
      youtubeId: p.video?.youtubeId || "",
      isActive: p.isActive,
    });
    setImageFiles([]);
    setEditingImages(p.images ? [...p.images] : []);
    setShowModal(true);
  };

  // Drag-and-drop reorder for existing images
  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const reordered = [...editingImages];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(i, 0, moved);
    dragIdx.current = i;
    setEditingImages(reordered);
  };
  const handleDrop = async () => {
    if (!editing) return;
    try {
      await api.put(`/products/${editing._id}/images/reorder`, { images: editingImages });
      toast.success("Image order saved!");
    } catch {
      toast.error("Failed to save image order");
    }
    dragIdx.current = null;
  };
  const deleteExistingImage = async (publicId) => {
    if (!editing) return;
    try {
      await api.delete(`/products/${editing._id}/images/${encodeURIComponent(publicId)}`);
      setEditingImages((imgs) => imgs.filter((img) => img.publicId !== publicId));
      toast.success("Image removed!");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock || !form.category) {
      toast.error("Fill required fields (Name, Price, Stock, Category)");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "") fd.append(k, v);
      });
      imageFiles.forEach((f) => fd.append("images", f));
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editing) {
        await api.put(`/products/${editing._id}`, fd, config);
        toast.success("Product updated!");
      } else {
        await api.post("/products", fd, config);
        toast.success("Product created!");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted!");
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const totalPages = Math.ceil(total / 20);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setEditingImages([]);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Products <span className="text-gray-400 font-normal text-base">({total})</span>
        </h2>
        <button onClick={openAdd} className="btn-fire text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card-admin p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card-admin overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Product", "Category", "Price", "Stock", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
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
              products.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden shrink-0">
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            🎆
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-800 max-w-[140px] truncate">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {p.category?.name || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      ₹{p.discountedPrice || p.price}
                    </span>
                    {p.discountedPrice && (
                      <span className="ml-1 text-xs text-gray-400 line-through">
                        ₹{p.price}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${p.stock <= 10 ? "text-red-600" : p.stock <= 50 ? "text-amber-600" : "text-green-600"}`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={p.isActive ? "badge-active" : "badge-inactive"}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl z-10 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {editing ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Product Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Discounted Price (₹)
                  </label>
                  <input
                    type="number"
                    value={form.discountedPrice}
                    onChange={(e) =>
                      setForm({ ...form, discountedPrice: e.target.value })
                    }
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="input-admin"
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                    className="input-admin resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Safety Instructions
                  </label>
                  <textarea
                    value={form.safetyInstructions}
                    onChange={(e) =>
                      setForm({ ...form, safetyInstructions: e.target.value })
                    }
                    rows={2}
                    className="input-admin resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    YouTube Video ID
                  </label>
                  <input
                    value={form.youtubeId}
                    onChange={(e) =>
                      setForm({ ...form, youtubeId: e.target.value })
                    }
                    className="input-admin"
                    placeholder="dQw4w9WgXcQ"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-xs font-semibold text-gray-600"
                  >
                    Active (visible on store)
                  </label>
                </div>
                {/* Existing image reordering section */}
                {editing && editingImages.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Current Images — drag to reorder (first = main display image)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editingImages.map((img, i) => (
                        <div
                          key={img.publicId}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDrop={handleDrop}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 cursor-grab active:cursor-grabbing"
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <GripVertical className="w-5 h-5 text-white" />
                          </div>
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1 py-0.5 rounded">Main</span>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteExistingImage(img.publicId)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">↑ Drag thumbnails to reorder. Changes save on drop.</p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    {editing ? "Add More Images" : "Product Images"}
                  </label>
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-5 h-5 text-gray-300" />
                    <span className="text-xs text-gray-400">
                      {imageFiles.length > 0
                        ? `${imageFiles.length} file(s) selected`
                        : editing?.images?.length
                          ? `${editing.images.length} existing · Click to add more`
                          : "Click to upload images"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        setImageFiles(Array.from(e.target.files))
                      }
                    />
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

export default ProductsPage;
