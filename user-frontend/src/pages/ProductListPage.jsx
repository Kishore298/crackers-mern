import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import ComboCard from "../components/ComboCard";
import SEO from "../components/SEO";

/* ─── tiny spinner ─── */
const Spinner = () => (
  <div className="flex justify-center py-10">
    <div
      className="w-9 h-9 rounded-full animate-spin"
      style={{
        border: "3px solid rgba(255,102,0,0.15)",
        borderTopColor: "#ff6600",
      }}
    />
  </div>
);

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state mapping from URL
  const searchFilter = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const sortFilter = searchParams.get("sort") || "";

  // Data state
  const [allCategories, setAllCategories] = useState([]); // For the sidebar
  const [groupedCategories, setGroupedCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Removed showFilter
  const [discountPct, setDiscountPct] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const observerRef = useRef(null);

  // Set filter and reset URL params
  const setFilter = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }

    if (key === "category") newParams.delete("filter");
    if (key === "filter") newParams.delete("category");

    setSearchParams(newParams);
  };

  // Initial fetch for sidebar categories and discount
  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setAllCategories(r.data.categories || []))
      .catch(() => { });
    api
      .get("/discount")
      .then((r) => {
        const d = r.data.discount;
        if (d?.isActive) setDiscountPct(d.percentage);
      })
      .catch(() => { });
  }, []);

  // Fetch Grouped Categories
  const fetchGroupedCategories = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (searchFilter) params.set("search", searchFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (sortFilter) params.set("sort", sortFilter);

      const filterParam = searchParams.get("filter");
      const activeCat = allCategories.find((c) => c.slug === categoryFilter || c._id === categoryFilter);
      const isComboCategory = activeCat?.name.toLowerCase().includes("combo");

      if (filterParam === "combos" || isComboCategory) {
        params.set("isCombo", "true");
      } else {
        params.set("isCombo", "false");
      }

      params.set("page", pageNum);
      params.set("limit", 5);

      const { data } = await api.get(`/categories/with-products?${params}`);

      if (pageNum === 1) {
        setGroupedCategories(data.categories || []);
      } else {
        setGroupedCategories((prev) => [...prev, ...(data.categories || [])]);
      }

      if (data.totalProducts !== undefined) {
        setTotalProductsCount(data.totalProducts);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [searchFilter, categoryFilter, sortFilter, searchParams, allCategories]);

  // Re-fetch on filter changes
  useEffect(() => {
    fetchGroupedCategories(1);
  }, [fetchGroupedCategories]);

  // Infinite Scroll logic using robust callback-ref pattern
  const loadMoreCategories = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    fetchGroupedCategories(page + 1);
  }, [page, hasMore, loadingMore, loading, fetchGroupedCategories]);

  const loadMoreRef = useRef(loadMoreCategories);
  useEffect(() => {
    loadMoreRef.current = loadMoreCategories;
  }, [loadMoreCategories]);

  const observerTargetRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      }, { threshold: 0.1 });
      observerRef.current.observe(node);
    }
  }, []);


  const sortOptions = [
    { value: "", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
  ];

  const sortedCategories = [...allCategories].sort((a, b) => {
    const isComboA = a.name.toLowerCase().includes("combo");
    const isComboB = b.name.toLowerCase().includes("combo");
    if (isComboA && !isComboB) return -1;
    if (!isComboA && isComboB) return 1;
    return 0;
  });

  const activeCatName = allCategories.find((c) => c.slug === categoryFilter || c._id === categoryFilter)?.name;
  const seoTitle = activeCatName ? `Buy ${activeCatName} Online` : "All Products";
  const seoDesc = activeCatName
    ? `Explore our wide range of premium ${activeCatName}. Best quality festive products from Sivakasi at V Crackers.`
    : "Browse the complete collection of V Crackers celebration packs, gift boxes, and festive items.";

  // Display actual total products in DB matching filter
  const totalProductsShown = totalProductsCount;

  return (
    <div className="min-h-screen relative" style={{ background: "#0a0814" }}>
      <SEO title={seoTitle} description={seoDesc} />
      {/* Page header */}
      <div className="py-8" style={{ background: "#0f0d1a", borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
        <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            {searchParams.get("filter") === "combos" ? "Stunning Combos 🎇" : (activeCatName ? `${activeCatName} 🎇` : "All Products 🎇")}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{totalProductsShown} {totalProductsShown === 1 ? 'item' : 'items'} available</p>
        </div>
      </div>

      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-6">
        {/* Search + controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchFilter}
              onChange={(e) => setFilter("search", e.target.value)}
              aria-label="Search products by name"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "#13111f", color: "#e5e5e5", border: "1px solid rgba(255,102,0,0.12)" }}
            />
          </div>
          <select
            value={sortFilter}
            onChange={(e) => setFilter("sort", e.target.value)}
            aria-label="Sort products"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#13111f", color: "#e5e5e5", border: "1px solid rgba(255,102,0,0.12)" }}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Zomato-style Category Slider (Mobile/Tablet Only) */}
        <div className="flex overflow-x-auto gap-4 pb-4 mb-8 scrollbar-hide snap-x lg:hidden">
          <button
            onClick={() => setFilter("category", "")}
            className="flex flex-col items-center gap-2 min-w-[72px] snap-start group"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center p-0.5 transition-all ${!categoryFilter && searchParams.get("filter") !== "combos" ? "bg-gradient-to-br from-[#8b0000] via-[#ff6600] to-[#ffcc33]" : "bg-transparent border border-white/10 group-hover:border-primary/50"}`}>
              <div className="w-full h-full rounded-full bg-[#13111f] flex items-center justify-center text-xl">
                🎇
              </div>
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${!categoryFilter && searchParams.get("filter") !== "combos" ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>
              All
            </span>
          </button>

          {sortedCategories.map((cat) => {
            const isComboCat = cat.name.toLowerCase().includes("combo");
            const isActive = categoryFilter === cat.slug || categoryFilter === cat._id || (isComboCat && searchParams.get("filter") === "combos");

            return (
              <button
                key={cat._id}
                onClick={() => {
                  if (isComboCat) {
                    setFilter("filter", "combos");
                  } else {
                    setFilter("category", cat.slug);
                  }
                }}
                className="flex flex-col items-center gap-2 min-w-[72px] snap-start group"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center p-0.5 transition-all ${isActive ? "bg-gradient-to-br from-[#8b0000] via-[#ff6600] to-[#ffcc33]" : "bg-transparent border border-white/10 group-hover:border-primary/50"}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#13111f] flex items-center justify-center">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{isComboCat ? '🎁' : '✨'}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar filters - desktop (lg only) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="rounded-2xl p-5 sticky top-24" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h3 className="font-heading font-semibold text-sm text-white mb-4">
                Categories
              </h3>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <button
                  onClick={() => setFilter("category", "")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!categoryFilter && searchParams.get("filter") !== "combos" ? "bg-primary text-white font-semibold" : "text-gray-400 hover:bg-surface-2 hover:text-primary"}`}
                >
                  All Products
                </button>
                {sortedCategories.map((cat) => {
                  const isComboCat = cat.name.toLowerCase().includes("combo");
                  const isActive = categoryFilter === cat.slug || categoryFilter === cat._id || (isComboCat && searchParams.get("filter") === "combos");

                  return (
                    <button
                      key={cat._id}
                      onClick={() => {
                        if (isComboCat) {
                          setFilter("filter", "combos");
                        } else {
                          setFilter("category", cat.slug);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${isActive ? "bg-primary text-white font-semibold" : "text-gray-400 hover:bg-surface-2 hover:text-primary"}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Grouped Categories List */}
          <div className="flex-1 min-w-0">
          {loading ? (
            <Spinner />
          ) : groupedCategories.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🎇</div>
              <h3 className="font-heading font-bold text-xl text-gray-400 mb-2">
                No products found
              </h3>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedCategories.map((cat) => (
                <div key={cat._id} className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
                  {/* Category Header */}
                  <div className="w-full flex items-center p-4 sm:p-5 text-left" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 rounded-full object-cover shadow-sm"
                          style={{ border: "1px solid rgba(255,102,0,0.15)" }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full shadow-sm"
                          style={{ background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" }}
                        />
                      )}
                      <div>
                        <h3 className="font-heading font-bold text-white text-lg sm:text-xl flex items-center gap-2">
                          {cat.name}
                          <span className="text-sm font-normal text-gray-400">({cat.productCount})</span>
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Category Body (Products Grid) */}
                  <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255,102,0,0.06)" }}>
                    {cat.products && cat.products.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {cat.products.map((p) => (
                          p.isCombo ? (
                            <ComboCard
                              key={p._id}
                              combo={p}
                              discountPct={discountPct}
                            />
                          ) : (
                            <ProductCard
                              key={p._id}
                              product={p}
                              discountPct={discountPct}
                            />
                          )
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm py-8 text-center">
                        No products match your filters in this category.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Intersection Observer Target */}
              <div ref={observerTargetRef} className="h-10 w-full flex items-center justify-center">
                {loadingMore && <Spinner />}
                {!hasMore && groupedCategories.length > 0 && (
                  <p className="text-gray-400 text-sm">You've reached the end of the catalog.</p>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
