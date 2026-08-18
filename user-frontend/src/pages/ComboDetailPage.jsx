import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  ChevronLeft,
  Minus,
  Plus,
  Youtube,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { formatComboName, getValidComboProducts } from "../utils/comboUtils";

const ComboDetailPage = () => {
  const { slug } = useParams();
  const { addToCart, getCartItem, updateQty } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [discountPct, setDiscountPct] = useState(0);

  const cartItem = product ? getCartItem(product._id) : null;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.product);
        if (data.product?.category?._id) {
          const rel = await api.get(
            `/products?category=${data.product.category._id}&limit=4`,
          );
          setRelated(
            rel.data.products
              .filter((p) => p._id !== data.product._id)
              .slice(0, 4),
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    api
      .get("/discount")
      .then((r) => {
        const d = r.data.discount;
        if (d?.isActive) setDiscountPct(d.percentage);
      })
      .catch(() => {});
    setActiveImg(0);
  }, [slug]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96 py-20">
        <div className="w-10 h-10 rounded-full border-4 border-dark-card-2 border-t-primary animate-spin" />
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-20 text-gray-400">
        <h3 className="text-xl font-heading font-bold">Combo not found</h3>
      </div>
    );



  const basePrice = product.price;
  const displayPct = product.discountPercent || 0;
  const effectivePrice = displayPct > 0 
    ? Math.round(basePrice * (1 - displayPct / 100)) 
    : basePrice;
  const showDiscount = displayPct > 0;
  const FORCE_COMING_SOON = false;
  const inStock = !FORCE_COMING_SOON && product.stock > 0;

  // Merge combo images and sub-product images
  const allImages = [...(product.images || [])];
  if (product.comboProducts) {
    product.comboProducts.forEach(cp => {
      if (cp.product?.images?.[0]) {
        if (!allImages.some(img => img.url === cp.product.images[0].url)) {
          allImages.push(cp.product.images[0]);
        }
      }
    });
  }

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.[0]?.url,
    "description": product.description || `${product.name} – a crackers combo pack from V Crackers, Sivakasi. Includes multiple fireworks products.`,
    "brand": {
      "@type": "Brand",
      "name": "V Crackers"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://vcrackers.in/combos/${product.slug}`,
      "priceCurrency": "INR",
      "price": effectivePrice,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "V Crackers"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vcrackers.in/" },
      { "@type": "ListItem", "position": 2, "name": "Combos", "item": "https://vcrackers.in/combos" },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://vcrackers.in/combos/${product.slug}` }
    ]
  };

  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO 
        title={`${product.name} – Crackers Combo`}
        description={product.description || `${product.name} – a crackers combo pack from V Crackers, Sivakasi. Includes multiple fireworks products, delivered across India.`}
        canonical={`https://vcrackers.in/combos/${product.slug}`}
        schemaMarkup={[productSchema, breadcrumbSchema]}
        ogImage={product.images?.[0]?.url}
      />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <Link to="/products?filter=combos" className="hover:text-primary transition-colors">
            Combos
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-gray-300 font-medium">{formatComboName(product)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ── Images ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden flex items-center justify-center w-full" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              {allImages?.[activeImg]?.url ? (
                <img
                  src={allImages[activeImg].url?.replace("/upload/", "/upload/q_auto,f_auto,w_800/")}
                  alt={product.name}
                  crossOrigin="anonymous"
                  width={600}
                  height={600}
                  decoding="async"
                  fetchpriority="high"
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              ) : (
                <div className="w-full h-[50vh] min-h-[300px] flex items-center justify-center p-6 bg-[#0f0d1a]">
                  <img 
                    src="/v-crackers-logo.webp" 
                    alt="V Crackers Logo" 
                    className="w-full h-full object-contain opacity-20 filter grayscale" 
                  />
                </div>
              )}
              {showDiscount && displayPct > 0 && (
                <span
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                  }}
                >
                  -{displayPct}% OFF
                </span>
              )}
            </div>
            {allImages?.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary shadow-primary" : "hover:border-primary-light"}`}
                    style={activeImg !== idx ? { borderColor: "rgba(255,102,0,0.15)" } : {}}
                  >
                    <img
                      src={img.url?.replace("/upload/", "/upload/q_auto,f_auto,w_100/")}
                      alt={`View ${product.name} ${idx + 1}`}
                      crossOrigin="anonymous"
                      width={64}
                      height={64}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col gap-5">
            <div className="flex gap-2 items-center flex-wrap">
              {product.category?.name && (
                <span className="tag-fire w-fit">{product.category.name}</span>
              )}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-extrabold text-white shadow shadow-yellow-500/50"
                style={{
                  background: "linear-gradient(140deg, #d4af37, #ffcc33, #d4af37)",
                  color: "#4a3200"
                }}
              >
                COMBO PACK
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white leading-tight">
              {formatComboName(product)}
            </h1>

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl font-bold text-primary">
                ₹{effectivePrice}
              </span>
              {showDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through self-end pb-0.5">
                    ₹{basePrice}
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-bold text-green-400 bg-green-400/10 self-center border border-green-400/20">
                    You save ₹{basePrice - effectivePrice}!
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div
              className={`inline-flex items-center gap-2 text-sm font-semibold ${inStock ? "text-green-400" : "text-red-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${inStock ? "bg-green-400" : "bg-red-400"}`}
              />
              {inStock
                ? `In Stock (${product.stock} units available)`
                : FORCE_COMING_SOON ? "Coming Soon" : "Out of Stock"}
            </div>

            {product.description && (
              <p className="text-gray-400 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {getValidComboProducts(product).length > 0 && (
              <div className="mt-2 mb-4">
                <h3 className="font-heading font-semibold text-white text-base mb-3 border-b border-gray-800 pb-2">
                  What's included in this combo:
                </h3>
                <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {getValidComboProducts(product).map((cp, idx) => {
                    const pData = cp.product;
                    if (!pData) return null;
                    const base = pData.price || 0;
                    let effective = base;
                    if (discountPct > 0) {
                      effective = Math.round(base * (1 - discountPct / 100));
                    } else {
                      effective = pData.discountedPrice ?? base;
                    }
                    
                    return (
                      <li key={pData._id || idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border border-white/10">
                        <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {pData.images?.[0]?.url ? (
                            <img src={pData.images[0].url} alt={pData.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-2 bg-[#0f0d1a]">
                              <img 
                                src="/v-crackers-logo.webp" 
                                alt="V Crackers Logo" 
                                className="w-full h-full object-contain opacity-40 filter grayscale" 
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{cp.quantity} × {pData.name}</p>
                          {effective < base ? (
                            <>
                              <p className="text-xs text-gray-400 line-through inline-block mr-2">₹{base}</p>
                              <p className="text-xs text-primary font-bold inline-block">₹{effective}</p>
                            </>
                          ) : (
                            <p className="text-xs text-primary font-bold inline-block">₹{base}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Qty + Add to Cart */}
            {inStock ? (
              <div className="flex items-center gap-4 flex-wrap">
                {cartItem ? (
                  <div className="flex items-center rounded-xl overflow-hidden h-12 w-48" style={{ border: "2px solid rgba(255,102,0,0.15)" }}>
                    <button
                      onClick={() => updateQty(product._id, cartItem.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-14 h-full flex items-center justify-center hover:bg-surface-2 transition-colors text-gray-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 h-full flex items-center justify-center font-bold text-white text-lg" style={{ borderLeft: "2px solid rgba(255,102,0,0.15)", borderRight: "2px solid rgba(255,102,0,0.15)" }}>
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(product._id, cartItem.quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-14 h-full flex items-center justify-center hover:bg-surface-2 transition-colors text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart({ ...product, effectivePrice }, 1)}
                    className="btn-fire flex-1 justify-center py-3.5 rounded-xl text-base h-12"
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                )}
              </div>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-base font-semibold mt-2 opacity-50 cursor-not-allowed"
                style={{ background: "#1a1726", color: "#555", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <ShoppingCart className="w-5 h-5" />
                Coming Soon
              </button>
            )}

            {/* Safety */}
            {product.safetyInstructions && (
              <div className="flex gap-3 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300 mb-1">
                    ⚠️ï¸ Safety Instructions
                  </p>
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    {product.safetyInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Video */}
            {product.video?.youtubeId && (() => {
              // Client-side fallback: extract ID from full URL if backend hasn't migrated yet
              const raw = product.video.youtubeId;
              let vid = raw;
              if (!/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
                const m = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
                  || raw.match(/youtube\.com\/(?:watch\?.*v=|embed\/)([a-zA-Z0-9_-]{11})/)
                  || raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                vid = m ? m[1] : raw;
              }
              return (
                <div>
                  <h3 className="font-heading font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" /> Combo Video
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,102,0,0.1)" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${vid}`}
                      title="Product Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="font-heading font-bold text-xl text-white mb-6">
              Related Combos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  discountPct={discountPct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboDetailPage;
