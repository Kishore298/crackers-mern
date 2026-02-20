import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "",
    page: 1,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", filters.page);
      params.set("limit", 20);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setFilters((f) => ({ ...f, category: cat }));
  }, [searchParams]);

  useEffect(() => {
    const { data } = api
      .get("/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const setFilter = (key, val) =>
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  const sortOptions = [
    { value: "", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-surface border-b border-orange-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
            All Products 🎆
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{total} products found</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search + controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search crackers..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-all border-orange-100 focus:border-primary"
              style={{
                "&:focus": { boxShadow: "0 0 0 3px rgba(255,69,0,0.12)" },
              }}
            />
          </div>
          <select
            value={filters.sort}
            onChange={(e) => setFilter("sort", e.target.value)}
            className="px-4 py-2.5 border-2 border-orange-100 rounded-xl text-sm outline-none focus:border-primary bg-white"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-orange-100 rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-colors sm:hidden"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters - desktop */}
          <aside className="hidden sm:block w-56 shrink-0">
            <div className="bg-surface rounded-2xl border border-orange-100 p-5 sticky top-24">
              <h3 className="font-heading font-semibold text-sm text-gray-900 mb-4">
                Categories
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setFilter("category", "")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!filters.category ? "bg-primary text-white font-semibold" : "text-gray-600 hover:bg-white hover:text-primary"}`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setFilter("category", cat._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filters.category === cat._id ? "bg-primary text-white font-semibold" : "text-gray-600 hover:bg-white hover:text-primary"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🎆</div>
                <h3 className="font-heading font-bold text-xl text-gray-600 mb-2">
                  No products found
                </h3>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {total > 20 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from(
                      { length: Math.ceil(total / 20) },
                      (_, i) => i + 1,
                    ).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setFilters((f) => ({ ...f, page: pg }))}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${filters.page === pg ? "text-white" : "bg-surface text-gray-600 hover:bg-surface-2"}`}
                        style={
                          filters.page === pg
                            ? {
                                background:
                                  "linear-gradient(135deg,#FF4500,#FF6B00)",
                              }
                            : {}
                        }
                      >
                        {pg}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
