import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { Link, useNavigationType, useLocation } from "react-router-dom";
// import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import { ArrowRight, ChevronRight, TrendingUp, ChevronDown, Search } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Shield, Zap, Percent } from "lucide-react";
import SEO from "../components/SEO";

/* ─── Discount banner (uses global Discount model) ─── */
const DiscountBanner = ({ discount }) => {
  if (!discount || !discount.isActive) return null;

  return (
    <section className="w-full md:max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div
        className="relative rounded-2xl overflow-hidden min-h-[200px] flex items-stretch"
        style={{ background: "#520606ff" }}
      >
        {/* Left content */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-10 py-8 w-full sm:w-3/5 gap-3">
          <span
            className="self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md"
            style={{ background: "#F5C518", color: "#000" }}
          >
            Limited Time Offer
          </span>

          <div>
            <h2 className="font-heading font-black text-white text-2xl sm:text-3xl leading-tight">
              {discount.label || "Special Sale"}
            </h2>
            <p
              className="font-heading font-black text-2xl sm:text-3xl leading-tight"
              style={{ color: "#F5C518" }}
            >
              Flat {discount.percentage}% OFF <span className="text-lg tracking-[1px] sm:text-2xl text-white block mt-1">+ exclusive cashbacks</span>
            </p>
          </div>

          <p className="text-gray-200 text-sm leading-relaxed max-w-xs">
            On all products sitewide. Celebrate more, spend less!
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-1">
            <Link
              to="/products"
              className="font-bold px-6 py-2.5 rounded-full text-sm shadow-md shrink-0 hover:scale-105 hover:shadow-lg hover:brightness-110 transition-all duration-300"
              style={{ background: "#F5C518", color: "#000" }}
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Right image */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/5 opacity-50 md:opacity-100 pointer-events-none">
          <img
            src="/diwali-family-celeb.webp"
            alt="V Crackers Celebration Family"
            width={400}
            height={200}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-right sm:object-center"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 30%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #520606ff 0%, transparent 0%)",
            }}
          />
        </div>
      </div>
    </section>
  );
};

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

/* ─── section header ─── */
const SectionHead = ({ tag, title, sub, to }) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      {tag && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary px-3 py-1 rounded-full mb-2" style={{ background: "rgba(255,102,0,0.1)" }}>
          {tag}
        </span>
      )}
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white leading-tight">
        {title}
      </h2>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
    {to && (
      <Link
        to={to}
        className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline shrink-0 ml-4"
      >
        View All <ChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

// const CustomPrevArrow = (props) => {
//   const { className, style, onClick } = props;
//   return (
//     <button
//       className={className}
//       style={{ ...style, display: "block", zIndex: 2, left: "20px" }}
//       onClick={onClick}
//       aria-label="Previous Slide"
//     />
//   );
// };

// const CustomNextArrow = (props) => {
//   const { className, style, onClick } = props;
//   return (
//     <button
//       className={className}
//       style={{ ...style, display: "block", zIndex: 2, right: "20px" }}
//       onClick={onClick}
//       aria-label="Next Slide"
//     />
//   );
// };

const STORAGE_KEY = "home_scroll_state";

const HomePage = () => {
  const navType = useNavigationType();
  const location = useLocation();

  // const [banners, setBanners] = useState([]);
  const [discount, setDiscount] = useState(null);
  const [initLoading, setInitLoading] = useState(true);

  // New states for infinite scroll categories
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search & sort state
  const [searchFilter, setSearchFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allCategories, setAllCategories] = useState([]);

  // Accordion state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const observerRef = useRef(null);

  // ─── Scroll Restoration ─────────────────────────────────────────
  const isRestoringRef = useRef(false);
  const pendingScrollYRef = useRef(null);

  // Read saved state on mount (only on POP navigation)
  const savedStateRef = useRef(() => {
    if (navType !== "POP") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  // Evaluate once
  const savedState = useRef(typeof savedStateRef.current === "function" ? savedStateRef.current() : savedStateRef.current);

  // Save lightweight state to sessionStorage on changes
  // (overwrites each time — supports multiple back navigations)
  useEffect(() => {
    // Don't save during restoration or initial loading
    if (isRestoringRef.current || initLoading) return;

    const state = {
      page,
      scrollY: window.scrollY,
      searchFilter,
      sortFilter,
      categoryFilter,
      collapsedCategories,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [page, searchFilter, sortFilter, categoryFilter, collapsedCategories, initLoading]);

  // Also save scrollY on scroll (debounced)
  useEffect(() => {
    let timer;
    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isRestoringRef.current) return;
        try {
          const raw = sessionStorage.getItem(STORAGE_KEY);
          if (raw) {
            const state = JSON.parse(raw);
            state.scrollY = window.scrollY;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          }
        } catch { /* ignore */ }
      }, 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ─── Data Fetching ──────────────────────────────────────────────

  // Fetch a single page of categories
  const fetchSinglePage = useCallback(async (pageNum, filters) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.category) params.set("category", filters.category);
    params.set("page", pageNum);
    params.set("limit", 5);
    const { data } = await api.get(`/categories/with-products?${params}`);
    return data;
  }, []);

  // Fetch pages 1..targetPage in sequence (for restoration)
  const fetchPagesUpTo = useCallback(async (targetPage, filters) => {
    let allCats = [];
    let moreAvailable = true;

    for (let p = 1; p <= targetPage; p++) {
      try {
        const data = await fetchSinglePage(p, filters);
        const newCats = data.categories || [];
        const existingIds = new Set(allCats.map(c => c._id));
        allCats = [...allCats, ...newCats.filter(c => !existingIds.has(c._id))];
        moreAvailable = data.hasMore;
        if (!moreAvailable) break;
      } catch (e) {
        console.error(e);
        break;
      }
    }

    return { categories: allCats, hasMore: moreAvailable };
  }, [fetchSinglePage]);

  // Original fetch for normal flow
  const fetchGroupedCategories = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setInitLoading(true);
    else setLoadingMore(true);

    try {
      const data = await fetchSinglePage(pageNum, {
        search: searchFilter,
        sort: sortFilter,
        category: categoryFilter,
      });

      if (append) {
        setCategories((prev) => {
          const newCats = data.categories || [];
          const existingIds = new Set(prev.map(c => c._id));
          return [...prev, ...newCats.filter(c => !existingIds.has(c._id))];
        });
      } else {
        setCategories(data.categories || []);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      if (pageNum === 1) setInitLoading(false);
      else setLoadingMore(false);
    }
  }, [searchFilter, sortFilter, categoryFilter, fetchSinglePage]);

  // Initial fetch for banners, discount, and page 1 categories
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [discountRes, catsRes] = await Promise.all([
          api.get("/discount"),
          api.get("/categories")
        ]);
        setDiscount(discountRes.data.discount || null);

        // Sort categories by order if available
        const sorted = (catsRes.data.categories || []).sort((a, b) => {
          return (a.order || 999) - (b.order || 999);
        });
        setAllCategories(sorted);
      } catch (e) {
        console.error(e);
      }
    };
    fetchGlobalData();
  }, []);

  // Fetch categories — either restore from saved state or normal fetch
  useEffect(() => {
    const saved = savedState.current;

    if (saved && navType === "POP") {
      // Restore mode: re-fetch pages 1..savedPage with saved filters
      isRestoringRef.current = true;
      setSearchFilter(saved.searchFilter || "");
      setSortFilter(saved.sortFilter || "");
      setCategoryFilter(saved.categoryFilter || "");
      setCollapsedCategories(saved.collapsedCategories || {});
      pendingScrollYRef.current = saved.scrollY || 0;

      setInitLoading(true);
      fetchPagesUpTo(saved.page || 1, {
        search: saved.searchFilter || "",
        sort: saved.sortFilter || "",
        category: saved.categoryFilter || "",
      }).then(({ categories: cats, hasMore: more }) => {
        setCategories(cats);
        setHasMore(more);
        setPage(saved.page || 1);
        setInitLoading(false);
        // Mark restoration complete so normal effects don't re-fetch
        // (savedState.current is consumed, set to null)
        savedState.current = null;
      });
    } else {
      // Normal mode: fetch page 1
      fetchGroupedCategories(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Re-fetch when filters change (but not on mount / restoration)
  const filtersInitialized = useRef(false);
  useEffect(() => {
    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      return;
    }
    if (isRestoringRef.current) return;
    fetchGroupedCategories(1, false);
  }, [fetchGroupedCategories]);

  // Restore scroll position after categories have rendered
  useLayoutEffect(() => {
    if (pendingScrollYRef.current !== null && !initLoading && categories.length > 0) {
      const scrollTarget = pendingScrollYRef.current;
      pendingScrollYRef.current = null;
      isRestoringRef.current = false;

      // Wait for DOM to fully paint before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollTarget);
        });
      });
    }
  }, [initLoading, categories]);

  // Infinite Scroll logic
  const loadMoreCategories = useCallback(() => {
    if (loadingMore || !hasMore || initLoading) return;
    fetchGroupedCategories(page + 1, true);
  }, [page, hasMore, loadingMore, initLoading, fetchGroupedCategories]);

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

  const toggleCategory = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // const sliderSettings = {
  //   dots: true,
  //   infinite: true,
  //   speed: 600,
  //   autoplay: true,
  //   autoplaySpeed: 4000,
  //   slidesToShow: 1,
  //   slidesToScroll: 1,
  //   pauseOnHover: true,
  //   arrows: banners.length > 1,
  //   prevArrow: <CustomPrevArrow />,
  //   nextArrow: <CustomNextArrow />,
  // };

  const discountPct = discount?.isActive ? discount.percentage : 0;

  return (
    <div className="animate-fade-in-up">
      <SEO
        title="Buy Premium Sivakasi Festive Products Online"
        description="V Crackers offers the best selection of celebration packs, gift boxes, and festive products at competitive prices. Celebration starts here."
      />
      {/* ══ Hero Banner (Commented out for new responsive banners) ══ 
      {banners.length > 0 ? (
        <div className="relative">
          <Slider {...sliderSettings}>
            {banners.map((b, index) => (
              <div key={b._id} className="relative">
                <a href={b.link || "#"}>
                  <img
                    src={b.imageUrl}
                    alt={b.title || "V Crackers Banner"}
                    width={1200}
                    height={500}
                    fetchpriority={index === 0 ? "high" : "auto"}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-[240px] md:h-[380px] lg:h-[500px] object-cover"
                  />
                  {b.title && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div className="w-full md:max-w-[90%] mx-auto px-8">
                        <h1 className="text-white font-heading font-bold text-3xl sm:text-5xl max-w-lg leading-tight">
                          {b.title}
                        </h1>
                      </div>
                    </div>
                  )}
                </a>
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <section
          className="relative overflow-hidden min-h-[350px] md:min-h-[500px] lg:min-h-[600px]"
          style={{ background: "linear-gradient(to right, #0a0814, #13111f)" }}
        >

          // Content overlay
          <div className="relative z-10 w-full md:max-w-[90%] mx-auto px-5 sm:px-10 flex flex-col md:flex-row items-center min-h-[350px] md:min-h-[500px] lg:min-h-[600px] gap-8">

            // Left content (Text & Buttons)
            <div className="flex-1 py-12 sm:py-20 max-w-xl text-center md:text-left relative z-10">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-6 shadow-sm"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <img
                  src="../golden-diya.webp"
                  alt="Golden Diya"
                  className="w-5 h-5 object-contain select-none"
                  draggable={false}
                />

                <span className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-wider uppercase">
                  Premium Diwali Collection 2026
                </span>
              </div>
              <h1 className="font-heading font-black text-xl sm:text-3xl md:text-3xl lg:text-6xl leading-tight mb-3 sm:mb-4">
                <span className="text-white">Celebrate with </span>
                <br className="hidden md:block" />
                <span className="fire-gradient-text">Luminous Joy</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-full md:max-w-lg">
                Experience the magic of Diwali with our premium, eco-friendly,
                and safe celebration products. Delivered straight to your doorstep with
                festive care.
              </p>

              <div className="flex flex-wrap gap-3 mb-6 sm:mb-8 justify-center md:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-white text-xs sm:text-sm shadow-lg hover:scale-105 transition-transform"
                  style={{
                    background:
                      "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                  }}
                >
                  Shop Collection <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products?filter=combos"
                  className="inline-flex items-center gap-2 font-bold px-5 sm:px-7 py-3 sm:py-4 rounded-full text-white text-xs sm:text-sm hover:bg-white/10 hover:scale-105 hover:shadow-glow-sm transition-all duration-300 shadow-lg animate-shimmer-btn"
                  style={{ background: "rgba(255, 102, 0, 0.08)", border: "1px solid rgba(255, 102, 0, 0.4)", backdropFilter: "blur(6px)" }}
                >
                  🎁 View Stunning Combos
                </Link>
              </div>

              // Trust badges
              <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start">
                {[
                  { icon: "💥", text: "Premium Crackers" },
                  { icon: "🚚", text: "Fast Delivery" },
                  { icon: "🛡️", text: "Safe & Certified" },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"
                  >
                    {icon} {text}
                  </span>
                ))}
              </div>
            </div>

            // Right image
            <div className="hidden md:flex flex-1 items-center justify-center relative">
              // Glowing aura behind image
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full z-0 pointer-events-none" />
              <img
                src="/festive-banner.webp"
                alt="Premium Sivakasi Festive Collection"
                width={600}
                height={600}
                fetchpriority="high"
                decoding="sync"
                className="w-full max-w-[500px] object-contain drop-shadow-2xl relative z-10 animate-float"
              />
            </div>
          </div>
        </section>
      )}
      */}

      {/* ══ NEW RESPONSIVE HERO SECTION ══ */}
      <section className="relative w-full min-h-[calc(100vh-64px)] overflow-hidden flex items-center">
        {/* Mobile Background */}
        <img
          src="/mobile.png"
          alt="Hero Banner Mobile"
          className="absolute inset-0 w-full h-full object-cover sm:hidden"
          loading="eager"
          fetchpriority="high"
        />
        {/* Tablet Background */}
        <img
          src="/tablet.png"
          alt="Hero Banner Tablet"
          className="absolute inset-0 w-full h-full object-cover hidden sm:block lg:hidden"
          loading="eager"
          fetchpriority="high"
        />
        {/* Desktop Background */}
        <img
          src="/desktop.png"
          alt="Hero Banner Desktop"
          className="absolute inset-0 w-full h-full object-cover hidden lg:block"
          loading="eager"
          fetchpriority="high"
        />

        {/* Content layer */}
        <div className="relative z-10 w-full md:max-w-[90%] mx-auto px-5 sm:px-10 flex items-center h-full">
          <div className="w-full flex-1 py-12 sm:py-20 max-w-xl flex flex-col items-center text-center md:items-start md:text-left md:ml-12 lg:ml-0">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-6 shadow-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(4px)"
              }}
            >
              <img
                src="../golden-diya.webp"
                alt="Golden Diya"
                className="w-5 h-5 object-contain select-none drop-shadow-md"
                draggable={false}
                fetchPriority="high"
              />
              <span className="text-[10px] sm:text-xs font-bold text-gray-200 tracking-wider uppercase drop-shadow-sm">
                Premium Diwali Collection 2026
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-4xl lg:text-6xl leading-tight mb-3 sm:mb-4 drop-shadow-lg">
              <span className="text-white">Celebrate with </span>
              <br className="hidden lg:block" />
              <span className="fire-gradient-text drop-shadow-lg">Luminous Joy</span>
            </h1>

            <p className="text-gray-100 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-full md:max-w-lg" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
              Experience the magic of Diwali with our premium celebration products. Delivered with festive care across India to make your celebrations brighter, safer, and more memorable.
            </p>

            <div className="flex flex-wrap gap-3 mb-6 sm:mb-8 justify-center md:justify-start">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-white text-xs sm:text-sm shadow-lg hover:scale-105 transition-transform"
                style={{
                  background:
                    "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                }}
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/combos"
                className="inline-flex items-center gap-2 font-bold px-5 sm:px-7 py-3 sm:py-4 rounded-full text-white text-xs sm:text-sm hover:bg-white/10 hover:scale-105 hover:shadow-glow-sm transition-all duration-300 shadow-lg animate-shimmer-btn"
                style={{ background: "rgba(255, 102, 0, 0.08)", border: "1px solid rgba(255, 102, 0, 0.4)", backdropFilter: "blur(6px)" }}
              >
                🎁 View Stunning Combos
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center hidden">
              {[
                { icon: "💥", text: "Premium Crackers" },
                { icon: "🚚", text: "Fast Delivery" },
                { icon: "🛡️", text: "Safe & Certified" },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-200 drop-shadow-md"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {icon} {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ Features strip ══ */}
      <div style={{ background: "#0f0d1a", borderTop: "1px solid rgba(255,102,0,0.08)", borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
        <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 justify-items-center sm:justify-items-start">
            {[
              { icon: Shield, text: "100% Safe & Certified" },
              { icon: Zap, text: "Premium Quality" },
              { icon: Percent, text: "Discounted Prices" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DiscountBanner discount={discount} />

      {/* ══════════════════════════════════════════
          SHOP BY CATEGORY (Accordion UI)
      ══════════════════════════════════════════ */}
      <section className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-12">
        <SectionHead
          tag={
            <>
              <TrendingUp className="w-3.5 h-3.5" /> Browse
            </>
          }
          title="Shop by Category"
          sub="Find exactly what you're looking for"
        />

        {/* ══ Filter Bar (Sticky on Desktop, Scrolls on Mobile) ══ */}
        <div className="relative lg:sticky z-40 lg:top-[94px] pt-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6" style={{ background: "#0a0814" }}>
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl" style={{ background: "#13111f", border: "1px solid rgba(255, 102, 0, 0.47)" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                aria-label="Search products by name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all shadow-sm"
                style={{ background: "#0f0d1a", color: "#e5e5e5", border: "1px solid rgba(255,102,0,0.1)" }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Category"
              className="hidden lg:block px-4 py-2.5 rounded-xl text-sm outline-none shadow-sm"
              style={{ background: "#0f0d1a", color: "#e5e5e5", border: "1px solid rgba(255,102,0,0.1)" }}
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat._id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              aria-label="Sort products"
              className="px-4 py-2.5 rounded-xl text-sm outline-none shadow-sm"
              style={{ background: "#0f0d1a", color: "#e5e5e5", border: "1px solid rgba(255,102,0,0.1)" }}
            >
              <option value="">Sort By: Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* ══ Zomato-style Category Slider (Sticky on Mobile, Hidden on Desktop) ══ */}
        <div className="sticky lg:hidden z-40 top-[64px] py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6" style={{ background: "#0a0814", borderBottom: "1px solid rgba(255, 102, 0, 0.1)" }}>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
            <button
              onClick={() => {
                setCategoryFilter("");
                setPage(1);
              }}
              className="flex flex-col items-center gap-2 min-w-[72px] w-[72px] snap-start group"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center p-0.5 transition-all ${!categoryFilter ? "bg-gradient-to-br from-[#8b0000] via-[#ff6600] to-[#ffcc33]" : "bg-transparent border border-white/10 group-hover:border-primary/50"}`}>
                <div className="w-full h-full rounded-full bg-[#13111f] flex items-center justify-center text-xl">
                  🎇
                </div>
              </div>
              <span className={`text-[10px] leading-tight font-semibold transition-colors text-center w-full ${!categoryFilter ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                All
              </span>
            </button>

            {allCategories.map((cat) => {
              const isComboCat = cat.name.toLowerCase().includes("combo");
              const isActive = categoryFilter === cat.slug || categoryFilter === cat._id;

              return (
                <button
                  key={cat._id}
                  onClick={() => {
                    setCategoryFilter(cat.slug);
                    setPage(1);
                  }}
                  className="flex flex-col items-center gap-2 min-w-[72px] w-[72px] snap-start group"
                >
                  <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center p-0.5 transition-all ${isActive ? "bg-gradient-to-br from-[#8b0000] via-[#ff6600] to-[#ffcc33]" : "bg-transparent border border-white/10 group-hover:border-primary/50"}`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#13111f] flex items-center justify-center">
                      {cat.image ? (
                        <img src={cat.image?.replace("/upload/", "/upload/q_auto,f_auto,w_100/")} alt={cat.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <span className="text-xl">{isComboCat ? '🎁' : '✨'}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] leading-tight font-semibold transition-colors text-center w-full ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {initLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const isCollapsed = collapsedCategories[cat._id];
              return (
                <div key={cat._id} className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#13111f", border: "1px solid #2b2438" }}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleCategory(cat._id)}
                    className="w-full flex items-center justify-between text-left accordion-header"
                    style={{
                      height: "58px",
                      padding: "0 20px",
                      borderRadius: "16px",
                      background: "#171523",
                      borderLeft: "4px solid #ff8a35",
                      borderTop: "1px solid #2b2438",
                      borderRight: "1px solid #2b2438",
                      borderBottom: "1px solid #2b2438",
                      transition: "background .2s ease, border-color .2s ease, transform .15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#1b1828"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#171523"; }}
                  >
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image?.replace("/upload/", "/upload/q_auto,f_auto,w_100/")}
                          alt={cat.name}
                          crossOrigin="anonymous"
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover shadow-sm"
                          style={{ border: "1px solid rgba(255,138,53,0.2)" }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full shadow-sm"
                          style={{ background: "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)" }}
                        />
                      )}
                      <h3 className="font-heading text-lg sm:text-xl flex items-center gap-2" style={{ fontWeight: 700, color: "#F8F8F8" }}>
                        {cat.name}
                        <span className="text-sm font-normal" style={{ color: "#A7A1B7" }}>({cat.productCount})</span>
                      </h3>
                    </div>
                    <div className={`p-2 rounded-full shadow-sm transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} style={{ background: "rgba(255,255,255,0.05)" }}>
                      <ChevronDown className="w-5 h-5" style={{ color: "#A7A1B7" }} />
                    </div>
                  </button>

                  {/* Accordion Body */}
                  <div className={`transition-all duration-500 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[10000px] opacity-100'}`}>
                    <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255,102,0,0.06)" }}>
                      {cat.products && cat.products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                          {cat.products.map((p) => (
                            <ProductCard
                              key={p._id}
                              product={p}
                              discountPct={discountPct}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm py-8 text-center">
                          No products in this category yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Intersection Observer Target using callback ref */}
            <div ref={observerTargetRef} className="h-10 w-full flex items-center justify-center">
              {loadingMore && <Spinner />}
              {!hasMore && categories.length > 0 && (
                <p className="text-gray-400 text-sm">You've reached the end of the catalog.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ══ Safety Section ══ */}
      <section className="py-16" style={{ background: "#0f0d1a" }}>
        <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — 2×2 feature cards */}
            <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
              {[
                {
                  iconBg: "rgba(76,175,80,0.1)",
                  iconColor: "#4CAF50",
                  title: "Eco-Friendly",
                  desc: "Certified green products with reduced emissions.",
                  customIcon: (
                    <span style={{ color: "#4CAF50", fontSize: 22 }}>🌿</span>
                  ),
                },
                {
                  iconBg: "rgba(255,160,0,0.1)",
                  iconColor: "#FFA000",
                  title: "Child Safe",
                  desc: "Specially curated safe range for kids.",
                  customIcon: (
                    <span style={{ color: "#FFA000", fontSize: 22 }}>🧒</span>
                  ),
                },
                {
                  iconBg: "rgba(92,107,192,0.1)",
                  iconColor: "#5C6BC0",
                  title: "Pet Friendly",
                  desc: "Low decibel products safe for your furry friends.",
                  customIcon: (
                    <span style={{ color: "#5C6BC0", fontSize: 22 }}>🛡️</span>
                  ),
                },
                {
                  iconBg: "rgba(233,30,99,0.1)",
                  iconColor: "#E91E63",
                  title: "Premium Quality",
                  desc: "Sourced from the best manufacturers in Sivakasi.",
                  customIcon: (
                    <span style={{ color: "#E91E63", fontSize: 22 }}>🏆</span>
                  ),
                },
              ].map(({ iconBg, title, desc, customIcon }) => (
                <div
                  key={title}
                  className="rounded-2xl p-5 shadow-sm hover:shadow-glow-sm transition-shadow flex flex-col gap-1.5 md:gap-3"
                  style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.08)" }}
                >
                  <div
                    className="w-8 h-8 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
                    style={{ background: iconBg }}
                  >
                    {customIcon}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base">
                      {title}
                    </p>
                    <p className="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Safety content */}
            <div className="order-1 lg:order-2">
              <p
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: "#ff6600" }}
              >
                Safety First
              </p>
              <h2 className="font-heading font-black text-white text-3xl sm:text-4xl leading-tight mb-4">
                Celebrate Responsibly with V Crackers 🔥
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Diwali is a festival of joy, and safety is our utmost priority.
                We ensure all our products meet the highest safety standards.
                Here are a few tips to ensure a safe celebration:
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Always use products in an open area.",
                  "Keep a bucket of water and sand nearby.",
                  "Maintain a safe distance at all times.",
                  "Supervise children at all times.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 shrink-0"
                      style={{ color: "#4CAF50" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-gray-400 text-sm leading-relaxed">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
