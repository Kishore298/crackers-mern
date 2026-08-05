import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, Search, GripVertical } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

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
  isCombo: false,
  comboProducts: [],
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
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, type: "product", loading: false });
  const [discountPct, setDiscountPct] = useState(0);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelErrors, setExcelErrors] = useState(null);
  const dragIdx = useRef(null);
  const [allStandardProducts, setAllStandardProducts] = useState([]);
  const [fetchingAllProducts, setFetchingAllProducts] = useState(false);
  const [comboCategoryFilter, setComboCategoryFilter] = useState("");
  const [comboProductSelect, setComboProductSelect] = useState("");
  const [comboQty, setComboQty] = useState(1);

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
    api
      .get("/discount")
      .then((r) => {
        const d = r.data.discount;
        if (d?.isActive) setDiscountPct(d.percentage);
      })
      .catch(() => {});
  }, []);

  const getEffectivePrice = (p) => {
    if (p.isCombo) return p.price;
    if (discountPct > 0) return Math.round(p.price * (1 - discountPct / 100));
    return p.discountedPrice || p.price;
  };

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
      isCombo: p.isCombo || false,
      comboProducts: p.comboProducts ? p.comboProducts.map(cp => ({
        product: cp.product?._id || cp.product,
        name: cp.product?.name,
        price: cp.product?.price,
        quantity: cp.quantity
      })) : [],
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
  const deleteExistingImage = (publicId) => {
    if (!editing) return;
    setConfirmDelete({ open: true, id: publicId, type: "image", loading: false });
  };

  const confirmDeleteImage = async () => {
    const publicId = confirmDelete.id;
    if (!publicId || !editing) return;
    setConfirmDelete({ ...confirmDelete, loading: true });
    try {
      await api.delete(`/products/${editing._id}/images/${encodeURIComponent(publicId)}`);
      setEditingImages((imgs) => imgs.filter((img) => img.publicId !== publicId));
      toast.success("Image removed!");
      setConfirmDelete({ open: false, id: null, type: "product", loading: false });
    } catch {
      toast.error("Failed to remove image");
      setConfirmDelete({ ...confirmDelete, loading: false });
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
        if (k === 'comboProducts') {
          if (form.isCombo) {
            fd.append(k, JSON.stringify(v.map(cp => ({ product: cp.product, quantity: cp.quantity }))));
          }
        } else if (k === 'isCombo') {
          fd.append(k, v);
        } else if (v !== "") {
          fd.append(k, v);
        }
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

  const handleDeleteProduct = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setConfirmDelete({ ...confirmDelete, loading: true });
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted!");
      fetchProducts();
      setConfirmDelete({ open: false, id: null, type: "product", loading: false });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
      setConfirmDelete({ ...confirmDelete, loading: false });
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    setUploadingExcel(true);
    try {
      const { data } = await api.post("/products/upload-excel", fd);
      toast.success(data.message || "Excel processed successfully!");
      if (data.errors && data.errors.length > 0) {
        setExcelErrors(data.errors);
      }
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload Excel");
    } finally {
      setUploadingExcel(false);
      e.target.value = null;
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

  useEffect(() => {
    if (showModal && form.isCombo && allStandardProducts.length === 0) {
      fetchAllStandardProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, form.isCombo]);

  const fetchAllStandardProducts = async () => {
    if (fetchingAllProducts) return;
    setFetchingAllProducts(true);
    try {
      const { data } = await api.get('/products/admin?limit=1000&isActive=true');
      const standard = data.products.filter(p => !p.isCombo);
      setAllStandardProducts(standard);
    } catch {
      toast.error("Failed to load products for combo builder");
    } finally {
      setFetchingAllProducts(false);
    }
  };

  return (
    <div>
      {excelErrors && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                Excel Upload Warnings ({excelErrors.length})
              </h3>
              <button onClick={() => setExcelErrors(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-red-50">
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 font-mono">
                {excelErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setExcelErrors(null)} className="btn-fire px-4 py-2 text-sm rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Products <span className="text-gray-400 font-normal text-base">({total})</span>
        </h2>
        <div className="flex gap-2">
          <label className={`btn-fire flex items-center justify-center text-sm px-4 py-2 cursor-pointer ${uploadingExcel ? 'opacity-50' : ''}`}>
            <Upload className="w-4 h-4 mr-1" />
            {uploadingExcel ? "Uploading..." : "Upload Excel"}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} disabled={uploadingExcel} />
          </label>
          <button onClick={openAdd} className="btn-fire text-sm px-4 py-2">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </button>
        </div>
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
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-1 bg-[#1a1726]">
                            <img src="/v-crackers-logo.png" alt="Fallback Logo" className="w-full h-full object-contain opacity-40 grayscale" />
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
                      ₹{getEffectivePrice(p)}
                    </span>
                    {getEffectivePrice(p) < p.price && (
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
                        onClick={() => setConfirmDelete({ open: true, id: p._id, type: "product", loading: false })}
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
                
                {/* Combo Settings */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="isCombo"
                      checked={form.isCombo}
                      onChange={(e) => setForm({ ...form, isCombo: e.target.checked })}
                      className="accent-primary"
                    />
                    <label htmlFor="isCombo" className="text-xs font-semibold text-gray-600">
                      This is a Combo Box
                    </label>
                  </div>
                  
                  {form.isCombo && (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Filter by Category</label>
                          <select 
                            value={comboCategoryFilter} 
                            onChange={e => setComboCategoryFilter(e.target.value)}
                            className="input-admin py-1.5 text-xs"
                          >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Select Product to Add</label>
                          <div className="flex gap-2">
                            <select 
                              value={comboProductSelect}
                              onChange={e => setComboProductSelect(e.target.value)}
                              className="input-admin py-1.5 text-xs flex-1"
                            >
                              <option value="">Select a product...</option>
                              {allStandardProducts
                                .filter(p => !comboCategoryFilter || p.category?._id === comboCategoryFilter || p.category === comboCategoryFilter)
                                .map(p => (
                                  <option key={p._id} value={p._id}>
                                    {p.name} - ₹{getEffectivePrice(p)}
                                  </option>
                                ))}
                            </select>
                            <input 
                              type="number" 
                              min="1"
                              value={comboQty}
                              onChange={e => setComboQty(e.target.value)}
                              className="input-admin py-1.5 text-xs w-16"
                              placeholder="Qty"
                            />
                            <button 
                              type="button"
                              disabled={!comboProductSelect}
                              onClick={() => {
                                const selected = allStandardProducts.find(p => p._id === comboProductSelect);
                                if (!selected) return;
                                if (form.comboProducts.some(cp => cp.product === selected._id)) {
                                  toast.error("Product already in combo");
                                  return;
                                }
                                setForm({
                                  ...form,
                                  comboProducts: [
                                    ...form.comboProducts,
                                    { product: selected._id, name: selected.name, price: getEffectivePrice(selected), quantity: Number(comboQty) }
                                  ]
                                });
                                setComboProductSelect("");
                                setComboQty(1);
                              }}
                              className="btn-fire px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Added Combo Items */}
                      {form.comboProducts.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3">Item</th>
                                <th className="text-left py-2 px-3">Price</th>
                                <th className="text-left py-2 px-3">Qty</th>
                                <th className="text-left py-2 px-3">Total</th>
                                <th className="text-center py-2 px-3">Act</th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.comboProducts.map((cp, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                  <td className="py-2 px-3 font-medium text-gray-800">{cp.name}</td>
                                  <td className="py-2 px-3 text-gray-500">₹{cp.price}</td>
                                  <td className="py-2 px-3">
                                    <input 
                                      type="number" 
                                      min="1"
                                      value={cp.quantity}
                                      onChange={e => {
                                        const newCombo = [...form.comboProducts];
                                        newCombo[idx].quantity = Number(e.target.value);
                                        setForm({ ...form, comboProducts: newCombo });
                                      }}
                                      className="border border-gray-200 rounded px-1 py-0.5 w-12 text-center focus:outline-none focus:border-primary"
                                    />
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-gray-700">₹{cp.price * cp.quantity}</td>
                                  <td className="py-2 px-3 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => setForm({
                                        ...form, 
                                        comboProducts: form.comboProducts.filter((_, i) => i !== idx)
                                      })}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                              <tr>
                                <td colSpan="3" className="py-2 px-3 text-right">Actual Value:</td>
                                <td colSpan="2" className="py-2 px-3 text-primary">
                                  ₹{form.comboProducts.reduce((sum, cp) => sum + (cp.price * cp.quantity), 0)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
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
                          <img src={img.url} alt="" className="w-full h-full object-contain" />
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
      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, type: "product", loading: false })}
        onConfirm={confirmDelete.type === "product" ? handleDeleteProduct : confirmDeleteImage}
        title={confirmDelete.type === "product" ? "Delete Product" : "Remove Image"}
        message={
          confirmDelete.type === "product"
            ? "Are you sure you want to delete this product? This action cannot be undone."
            : "Are you sure you want to remove this image from the product?"
        }
        confirmText="Confirm"
        loading={confirmDelete.loading}
      />
    </div>
  );
};

export default ProductsPage;
