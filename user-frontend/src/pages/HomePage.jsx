import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowRight, ChevronRight, TrendingUp, Clock } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Truck, Shield, Zap, Percent } from "lucide-react";

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
        <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-2/5">
          <img
            src="/family-celeb-crackers.png"
            alt="Celebration"
            className="w-full h-full object-cover object-center"
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

/* ─── Horizontal product row (mobile) ─── */
const ProductRow = ({ products, loading, discountPct }) => {
  if (loading) return <Spinner />;
  if (!products.length)
    return <p className="text-sm text-gray-400 py-4">No products yet.</p>;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      {products.map((p) => (
        <div key={p._id} className="snap-start shrink-0 w-44 sm:w-52">
          <ProductCard product={p} discountPct={discountPct} />
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════ */
const HomePage = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});
  const [discount, setDiscount] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  /* ── initial fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes, popRes, topRes, discountRes] =
          await Promise.all([
            api.get("/banners"),
            api.get("/categories"),
            api.get("/products/popular?limit=25"),
            api.get("/products?limit=8&sort=-createdAt"),
            api.get("/discount"),
          ]);
        setBanners(bannerRes.data.banners || []);
        const cats = catRes.data.categories || [];
        setCategories(cats);
        if (cats.length) setActiveCategory(cats[0]._id);
        setPopularProducts(popRes.data.products || []);
        setTopPicks(topRes.data.products || []);
        setDiscount(discountRes.data.discount || null);
      } catch (e) {
        console.error(e);
      } finally {
        setInitLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── lazy load per category ── */
  const loadCategoryProducts = useCallback(
    async (catId) => {
      if (categoryProducts[catId] || categoryLoading[catId]) return;
      setCategoryLoading((p) => ({ ...p, [catId]: true }));
      try {
        const { data } = await api.get(`/products?category=${catId}&limit=12`);
        setCategoryProducts((p) => ({
          ...p,
          [catId]: data.products || [],
        }));
      } catch {
        setCategoryProducts((p) => ({ ...p, [catId]: [] }));
      } finally {
        setCategoryLoading((p) => ({ ...p, [catId]: false }));
      }
    },
    [categoryProducts, categoryLoading],
  );

  /* mobile: load all category products on mount */
  useEffect(() => {
    if (!initLoading && categories.length) {
      categories.forEach((c) => loadCategoryProducts(c._id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initLoading, categories]);

  /* desktop: load active tab */
  useEffect(() => {
    if (activeCategory) loadCategoryProducts(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

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
  };

  const discountPct = discount?.isActive ? discount.percentage : 0;

  const giftCategory = categories.find((c) =>
    c.name.toLowerCase().includes("gift"),
  );

  return (
    <div className="animate-fade-in-up">
      {/* ══ Hero Banner ══ */}
      {banners.length > 0 ? (
        <div className="relative">
          <Slider {...sliderSettings}>
            {banners.map((b) => (
              <div key={b._id} className="relative">
                <a href={b.link || "#"}>
                  <img
                    src={b.imageUrl}
                    alt={b.title || "Banner"}
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
              {/* Badge */}
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
                and safe crackers. Delivered straight to your doorstep with
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

              {/* Trust badges */}
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

            {/* Right image */}
            <div className="hidden md:flex flex-1 items-center justify-center">
              <img
                src="/crackers-banner.png"
                alt="Premium Crackers"
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

      {/* ══ Featured Discount Banner ══ */}
      <DiscountBanner discount={discount} />

      {/* ══════════════════════════════════════════
          BROWSE BY CATEGORY
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
          to="/products"
        />

        {initLoading ? (
          <Spinner />
        ) : (
          <>
            {/* ── MOBILE (< lg): stacked category + horizontal scroll ── */}
            <div className="block lg:hidden space-y-10">
              {categories.map((cat) => (
                <div key={cat._id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{
                            background:
                              "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                          }}
                        />
                      )}
                      <span className="font-heading font-bold text-gray-900 text-lg">
                        {cat.name}
                      </span>
                    </div>
                    <Link
                      to={`/products?category=${cat._id}`}
                      className="text-xs text-primary font-semibold flex items-center gap-0.5"
                    >
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <ProductRow
                    products={categoryProducts[cat._id] || []}
                    loading={categoryLoading[cat._id] || initLoading}
                    discountPct={discountPct}
                  />
                </div>
              ))}
            </div>

            {/* ── DESKTOP (>= lg): tab bar + grid ── */}
            <div className="hidden lg:block">
              <div className="flex gap-2 flex-wrap mb-8">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setActiveCategory(cat._id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ring-2 ${
                        isActive
                          ? "text-white ring-transparent shadow-md"
                          : "bg-white text-gray-600 ring-gray-200 hover:text-primary"
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                            }
                          : {}
                      }
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full shrink-0 ring-2 ring-white"
                          style={{
                            background: isActive
                              ? "rgba(255,255,255,0.3)"
                              : "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                          }}
                        />
                      )}
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {activeCategory && (
                <>
                  {categoryLoading[activeCategory] || initLoading ? (
                    <Spinner />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                      {(categoryProducts[activeCategory] || []).map((p) => (
                        <ProductCard
                          key={p._id}
                          product={p}
                          discountPct={discountPct}
                        />
                      ))}
                      {(categoryProducts[activeCategory] || []).length ===
                        0 && (
                        <p className="col-span-5 text-gray-400 text-sm py-8 text-center">
                          No products in this category yet.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-6 text-center">
                    <Link
                      to={`/products?category=${activeCategory}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      View All{" "}
                      {categories.find((c) => c._id === activeCategory)?.name}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════
          COLLECTIONS (Categories visual grid)
      ══════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="bg-surface border-t border-orange-100 py-6 md:py-12">
          <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
            <SectionHead
              tag="✨ Collections"
              title="Explore Our Collections"
              sub="Browse by your favourite cracker type"
              to="/products"
            />

            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide lg:hidden">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="snap-start shrink-0 w-28 rounded-2xl overflow-hidden border border-orange-100 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-surface overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: "linear-gradient(135deg,#FFE4D0,#ff6600)",
                        }}
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-heading font-bold text-gray-900 text-xs text-center">
                      {cat.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/2] bg-surface border border-orange-100 hover:shadow-lg transition-shadow"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          "linear-gradient(135deg,#FFE4D0 0%,#ff6600 100%)",
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-heading font-bold text-lg">
                      {cat.name}
                    </p>
                    <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                      Shop now <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          POPULAR PRODUCTS (top 25 by sales)
      ══════════════════════════════════════════ */}
      <section className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-12">
        <SectionHead
          tag={
            <>
              <TrendingUp className="w-3.5 h-3.5" /> Trending
            </>
          }
          title="Popular Products 🔥"
          sub="What everyone's buying this season"
          to="/products"
        />

        {initLoading ? (
          <Spinner />
        ) : (
          <>
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:hidden">
              {popularProducts.map((p) => (
                <div key={p._id} className="snap-start shrink-0 w-44 sm:w-52">
                  <ProductCard product={p} discountPct={discountPct} />
                </div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden lg:grid grid-cols-3 xl:grid-cols-5 gap-5">
              {popularProducts.slice(0, 25).map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  discountPct={discountPct}
                />
              ))}
            </div>
          </>
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
                  desc: "Certified green crackers with reduced emissions.",
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
                  desc: "Low decibel crackers safe for your furry friends.",
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
                    <p className="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed">
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
              <p className="text-gray-500 text-base leading-relaxed mb-6">
                Diwali is a festival of joy, and safety is our utmost priority.
                We ensure all our products meet the highest safety standards.
                Here are a few tips to ensure a safe celebration:
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Always light crackers in an open area.",
                  "Keep a bucket of water and sand nearby.",
                  "Maintain a safe distance while lighting aerial shots.",
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
