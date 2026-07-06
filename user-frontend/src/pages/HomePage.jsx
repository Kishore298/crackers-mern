import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowRight, ChevronRight, TrendingUp, ChevronDown, Search } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Truck, Shield, Zap, Percent } from "lucide-react";
import SEO from "../components/SEO";

/* ─── Discount banner (uses global Discount model) ─── */
const DiscountBanner = ({ discount }) => {
  if (!discount || !discount.isActive) return null;

  return (
    <section className="w-full md:max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div
        className="relative rounded-2xl overflow-hidden min-h-[200px] flex items-stretch"
        style={{ background: "#6B0F0F" }}
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
              Flat {discount.percentage}% OFF
            </p>
          </div>

          <p className="text-white/75 text-sm leading-relaxed max-w-xs">
            On all products sitewide. Celebrate more, spend less!
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-1">
            <Link
              to="/products"
              className="bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full text-sm hover:bg-orange-50 transition-colors shadow-md shrink-0"
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Right image */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/5 opacity-20 sm:opacity-100 pointer-events-none">
          <img
            src="/family-celeb-festive.png"
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
                "linear-gradient(to right, #6B0F0F 0%, transparent 35%)",
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
        border: "3px solid #FFD4B8",
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
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-surface-2 px-3 py-1 rounded-full mb-2">
          {tag}
        </span>
      )}
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 leading-tight">
        {title}
      </h2>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
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

const CustomPrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <button
      className={className}
      style={{ ...style, display: "block", zIndex: 2, left: "20px" }}
      onClick={onClick}
      aria-label="Previous Slide"
    />
  );
};

const CustomNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <button
      className={className}
      style={{ ...style, display: "block", zIndex: 2, right: "20px" }}
      onClick={onClick}
      aria-label="Next Slide"
    />
  );
};

const HomePage = () => {
  const [banners, setBanners] = useState([]);
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
  
  // Accordion state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const observerRef = useRef(null);
  
  // Fetch specific page based on current filters
  const fetchGroupedCategories = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setInitLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (searchFilter) params.set("search", searchFilter);
      if (sortFilter) params.set("sort", sortFilter);
      params.set("page", pageNum);
      params.set("limit", 5);

      const { data } = await api.get(`/categories/with-products?${params}`);
      
      if (append) {
        setCategories((prev) => {
          // Prevent duplicates by checking _id
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
  }, [searchFilter, sortFilter]);

  // Initial fetch for banners, discount, and page 1 categories
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [bannerRes, discountRes] = await Promise.all([
          api.get("/banners"),
          api.get("/discount"),
        ]);
        setBanners(bannerRes.data.banners || []);
        setDiscount(discountRes.data.discount || null);
      } catch (e) {
        console.error(e);
      }
    };
    fetchGlobalData();
  }, []);

  // Fetch categories when filters change
  useEffect(() => {
    fetchGroupedCategories(1, false);
  }, [fetchGroupedCategories]);

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

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: true,
    arrows: banners.length > 1,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
  };

  const discountPct = discount?.isActive ? discount.percentage : 0;
  const giftCategory = categories.find((c) =>
    c.name.toLowerCase().includes("gift"),
  );

  return (
    <div className="animate-fade-in-up">
      <SEO 
        title="Buy Premium Sivakasi Festive Products Online"
        description="V Crackers offers the best selection of celebration packs, gift boxes, and festive products at competitive prices. Celebration starts here."
      />
      {/* ══ Hero Banner ══ */}
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
                    className="w-full h-[240px] sm:h-[380px] lg:h-[500px] object-cover"
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
        /* ── Static hero (reference image style) ── */
        <section
          className="relative overflow-hidden"
          style={{ background: "#FFF8F5", minHeight: "320px" }}
        >
          <div className="w-full md:max-w-[90%] mx-auto px-5 sm:px-10 flex items-center min-h-[320px] sm:min-h-[420px]">
            {/* Left content */}
            <div className="relative z-10 flex-1 py-8 sm:py-16 max-w-lg text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-orange-100 rounded-full px-3 py-1 mb-4 sm:mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span className="text-[10px] sm:text-xs font-bold text-gray-600 tracking-wider uppercase">
                  Premium Diwali Collection 2026
                </span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-5xl md:text-6xl leading-tight mb-2 sm:mb-3">
                <span className="text-gray-900">Celebrate with </span>
                <br className="hidden md:block" />
                <span style={{ color: "#ff6600" }}>Luminous Joy</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-base leading-relaxed mb-5 sm:mb-8 max-w-full md:max-w-lg">
                Experience the magic of Diwali with our premium, eco-friendly,
                and safe celebration products. Delivered straight to your doorstep with
                festive care.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-8 justify-center md:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 font-bold px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full text-white text-xs sm:text-sm shadow-lg"
                  style={{
                    background:
                      "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                  }}
                >
                  Shop Collection <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={giftCategory ? `/products?category=${giftCategory._id}` : "/products"}
                  className="inline-flex items-center gap-2 font-bold px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full text-gray-700 text-xs sm:text-sm bg-white border border-gray-200 hover:border-orange-300 transition-colors"
                >
                  🎁 View Gift Boxes
                </Link>
              </div>
            </div>
            {/* Right image */}
            <div className="hidden md:flex flex-1 items-center justify-center">
              <img
                src="/festive-banner.png"
                alt="Premium Sivakasi Festive Collection"
                width={600}
                height={600}
                fetchpriority="high"
                loading="eager"
                decoding="async"
                className="max-h-[600px] w-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ Features strip ══ */}
      <div className="bg-surface border-y border-orange-100">
        <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-32">
            {[
              { icon: Truck, text: "Free Delivery above ₹3500" },
              { icon: Shield, text: "100% Safe & Certified" },
              { icon: Zap, text: "Premium Quality" },
              { icon: Percent, text: "Discounted Prices" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-gray-600">
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-surface p-4 rounded-2xl border border-orange-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="Search products by name"
              className="w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-all border-white bg-white focus:border-primary shadow-sm"
            />
          </div>
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            aria-label="Sort products"
            className="px-4 py-2.5 border-2 border-white rounded-xl text-sm outline-none focus:border-primary bg-white shadow-sm"
          >
            <option value="">Sort By: Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {initLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const isCollapsed = collapsedCategories[cat._id];
              return (
                <div key={cat._id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                  {/* Accordion Header */}
                  <button 
                    onClick={() => toggleCategory(cat._id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 bg-surface hover:bg-surface-2 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full shadow-sm"
                          style={{ background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" }}
                        />
                      )}
                      <div>
                        <h3 className="font-heading font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2">
                          {cat.name} 
                          <span className="text-sm font-normal text-gray-500">({cat.productCount})</span>
                        </h3>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full bg-white shadow-sm transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    </div>
                  </button>
                  
                  {/* Accordion Body */}
                  <div className={`transition-all duration-500 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[10000px] opacity-100'}`}>
                    <div className="p-4 sm:p-6 border-t border-orange-50">
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
                        <p className="text-gray-400 text-sm py-8 text-center">
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
      <section className="py-16" style={{ background: "#F5F6FA" }}>
        <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — 2×2 feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M12 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 18c0-2.21 2.69-4 6-4s6 1.79 6 4" />
                    </svg>
                  ),
                  iconBg: "#E8F5E9",
                  iconColor: "#4CAF50",
                  title: "Eco-Friendly",
                  desc: "Certified green products with reduced emissions.",
                  customIcon: (
                    <span style={{ color: "#4CAF50", fontSize: 22 }}>🌿</span>
                  ),
                },
                {
                  icon: null,
                  iconBg: "#FFF8E1",
                  iconColor: "#FFA000",
                  title: "Child Safe",
                  desc: "Specially curated safe range for kids.",
                  customIcon: (
                    <span style={{ color: "#FFA000", fontSize: 22 }}>🧒</span>
                  ),
                },
                {
                  icon: null,
                  iconBg: "#E8EAF6",
                  iconColor: "#5C6BC0",
                  title: "Pet Friendly",
                  desc: "Low decibel products safe for your furry friends.",
                  customIcon: (
                    <span style={{ color: "#5C6BC0", fontSize: 22 }}>🛡️</span>
                  ),
                },
                {
                  icon: null,
                  iconBg: "#FCE4EC",
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
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1.5 md:gap-3"
                >
                  <div
                    className="w-8 h-8 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
                    style={{ background: iconBg }}
                  >
                    {customIcon}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-gray-900 text-base">
                      {title}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Safety content */}
            <div>
              <p
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: "#ff6600" }}
              >
                Safety First
              </p>
              <h2 className="font-heading font-black text-gray-900 text-3xl sm:text-4xl leading-tight mb-4">
                Celebrate Responsibly with V Crackers 🔥
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
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
                    <span className="text-gray-700 text-sm leading-relaxed">
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

