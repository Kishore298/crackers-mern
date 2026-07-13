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

const ComboDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [discountPct, setDiscountPct] = useState(0);

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
    setQty(1);
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

  // Calculate total original value of all products in the combo
  let totalOriginalValue = 0;
  if (product.comboProducts && product.comboProducts.length > 0) {
    totalOriginalValue = product.comboProducts.reduce((sum, cp) => {
      const pData = cp.product;
      if (!pData) return sum;
      const base = pData.price || 0;
      let effective = base;
      if (discountPct > 0) {
        effective = Math.round(base * (1 - discountPct / 100));
      } else {
        effective = pData.discountedPrice ?? base;
      }
      return sum + (effective * (cp.quantity || 1));
    }, 0);
  }

  const effectivePrice = product.price;
  const basePrice = totalOriginalValue > product.price ? totalOriginalValue : product.price;
  const showDiscount = totalOriginalValue > product.price;
  const displayPct = 0;
  const inStock = product.stock > 0;

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
    "description": product.description || `Buy ${product.name} at V Crackers. Quality products from Sivakasi.`,
    "brand": {
      "@type": "Brand",
      "name": "V Crackers"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": effectivePrice,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO 
        title={`${product.name} - Stunning Combo`} 
        description={product.description || `Buy ${product.name} combo online at V Crackers. Premium quality combos from Sivakasi.`}
        schemaMarkup={productSchema}
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
          <span className="text-gray-300 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ── Images ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              {allImages?.[activeImg]?.url ? (
                <img
                  src={allImages[activeImg].url?.replace("/upload/", "/upload/q_auto,f_auto,w_800/")}
                  alt={product.name}
                  crossOrigin="anonymous"
                  width={600}
                  height={600}
                  decoding="async"
                  fetchpriority="high"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)",
                  }}
                />
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
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-primary">
                ₹{effectivePrice}
              </span>
              {showDiscount && (
                <span className="text-lg text-gray-400 line-through self-end pb-0.5">
                  ₹{basePrice}
                </span>
              )}
              {showDiscount && basePrice - effectivePrice > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                  }}
                >
                  You save ₹{basePrice - effectivePrice}
                </span>
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
                : "Out of Stock"}
            </div>

            {product.description && (
              <p className="text-gray-400 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {product.comboProducts && product.comboProducts.length > 0 && (
              <div className="mt-2 mb-4">
                <h3 className="font-heading font-semibold text-white text-base mb-3 border-b border-gray-800 pb-2">
                  What's included in this combo:
                </h3>
                <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {product.comboProducts.map((cp, idx) => {
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
                            <span className="text-xl">🎇</span>
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
            {inStock && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "2px solid rgba(255,102,0,0.15)" }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                    className="px-4 py-3 hover:bg-surface-2 transition-colors text-gray-400"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-3 font-bold text-white" style={{ borderLeft: "2px solid rgba(255,102,0,0.15)", borderRight: "2px solid rgba(255,102,0,0.15)" }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    aria-label="Increase quantity"
                    className="px-4 py-3 hover:bg-surface-2 transition-colors text-gray-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => addToCart({ ...product, effectivePrice }, qty)}
                  className="btn-fire flex-1 justify-center py-3.5 rounded-xl text-base"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
              </div>
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
