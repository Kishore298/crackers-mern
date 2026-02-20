import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Flame,
  ArrowRight,
  Zap,
  Shield,
  Truck,
  Star,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const HomePage = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes, prodRes] = await Promise.all([
          api.get("/banners"),
          api.get("/categories"),
          api.get("/products?limit=8"),
        ]);
        setBanners(bannerRes.data.banners || []);
        setCategories(catRes.data.categories || []);
        setFeaturedProducts(prodRes.data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const catIcons = ["🚀", "✨", "🌸", "🎁", "🌀", "🌟", "🎆", "💥"];

  return (
    <div className="animate-fade-in-up">
      {/* ── Hero Banner ── */}
      {banners.length > 0 ? (
        <div className="relative">
          <Slider {...sliderSettings}>
            {banners.map((b) => (
              <div key={b._id} className="relative">
                <a href={b.link || "#"}>
                  <img
                    src={b.imageUrl}
                    alt={b.title || "Banner"}
                    className="w-full h-[260px] sm:h-[380px] lg:h-[500px] object-cover"
                  />
                  {b.title && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div className="max-w-7xl mx-auto px-8">
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
        /* Default hero if no banners */
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg,#FF4500 0%,#FF6B00 50%,#FFB347 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            {["🎆", "🎇", "✨", "🚀", "💥"].map((e, i) => (
              <span
                key={i}
                className="absolute text-5xl"
                style={{
                  top: `${10 + i * 18}%`,
                  left: `${5 + i * 20}%`,
                  transform: "rotate(15deg)",
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-white relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold mb-6">
              <Flame className="w-4 h-4" /> Festival Season Sale – Up to 40%
              Off!
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-6xl mb-4 leading-tight">
              Light Up Your <br />
              Celebrations! 🎆
            </h1>
            <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
              Premium quality crackers from Kovilpatti's most trusted brand.
              Safe, vibrant, spectacular.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/products"
                className="bg-white text-primary font-bold px-8 py-3.5 rounded-full hover:bg-orange-50 transition-colors text-lg shadow-lg"
              >
                Shop Now <ArrowRight className="inline w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Features strip ── */}
      <div className="bg-surface border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Truck, text: "Free Delivery above ₹999" },
              { icon: Shield, text: "100% Safe & Certified" },
              { icon: Zap, text: "Premium Quality" },
              { icon: Star, text: "10,000+ Happy Customers" },
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

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10">
            <span className="tag-fire">Browse by Category</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mt-2 text-gray-900">
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-orange-100 hover:border-primary hover:shadow-primary card-hover transition-all duration-200 text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    catIcons[idx % catIcons.length]
                  )}
                </div>
                <span className="font-heading font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="bg-surface py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="tag-fire">Featured</span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl mt-1 text-gray-900">
                Best Sellers 🔥
              </h2>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div
                className="w-10 h-10 rounded-full border-3 border-surface-2 border-t-primary animate-spin"
                style={{
                  borderWidth: "3px",
                  borderTopColor: "#FF4500",
                  borderColor: "#FFD4B8 #FFD4B8 #FFD4B8 #FF4500",
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {featuredProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Safety Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#FF4500,#FF6B00)" }}
        >
          <div className="absolute inset-0 opacity-10 text-5xl flex gap-8 items-center overflow-hidden">
            {"🎆🎇✨🚀💥🎆🎇✨🚀💥".split("").map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-8 sm:px-14 py-10 gap-6">
            <div className="text-white text-center sm:text-left">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-2">
                Safety First Always! 🛡️
              </h2>
              <p className="text-white/85 text-sm max-w-md">
                All our products meet BIS standards. Always use crackers under
                adult supervision. Follow safety guidelines for a joyful
                celebration.
              </p>
            </div>
            <Link
              to="/products"
              className="bg-white text-primary font-bold px-8 py-3.5 rounded-full whitespace-nowrap hover:bg-orange-50 transition-colors shadow-lg shrink-0"
            >
              Shop Safely →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
