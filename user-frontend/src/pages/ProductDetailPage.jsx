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

const ProductDetailPage = () => {
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
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-20 text-gray-400">
        <h3 className="text-xl font-heading font-bold">Product not found</h3>
      </div>
    );

  // Apply global discount to base price
  const basePrice = product.price;
  const effectivePrice =
    discountPct > 0
      ? Math.round(basePrice * (1 - discountPct / 100))
      : (product.discountedPrice ?? basePrice);
  const showDiscount =
    discountPct > 0 ||
    (product.discountedPrice && product.discountedPrice < basePrice);
  const displayPct =
    discountPct > 0
      ? discountPct
      : product.discountedPrice
        ? Math.round(((basePrice - product.discountedPrice) / basePrice) * 100)
        : 0;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-white animate-fade-in-up">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <Link to="/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-gray-600 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ── Images ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square bg-surface border border-orange-100">
              {product.images?.[activeImg]?.url ? (
                <img
                  src={product.images[activeImg].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
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
            {product.images?.length > 1 && (
              <div className="flex gap-2.5 mt-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary shadow-primary" : "border-orange-100 hover:border-primary-light"}`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col gap-5">
            {product.category?.name && (
              <span className="tag-fire w-fit">{product.category.name}</span>
            )}
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 leading-tight">
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
              {showDiscount && displayPct > 0 && (
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
              className={`inline-flex items-center gap-2 text-sm font-semibold ${inStock ? "text-green-600" : "text-red-600"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`}
              />
              {inStock
                ? `In Stock (${product.stock} units available)`
                : "Out of Stock"}
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Qty + Add to Cart */}
            {inStock && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border-2 border-orange-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-3 hover:bg-surface transition-colors text-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-3 font-bold text-gray-900 border-x-2 border-orange-100">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="px-4 py-3 hover:bg-surface transition-colors text-gray-600"
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
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">
                    ⚠️ Safety Instructions
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {product.safetyInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Video */}
            {product.video?.youtubeId && (
              <div>
                <h3 className="font-heading font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-600" /> Product Video
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden border border-orange-100">
                  <iframe
                    src={`https://www.youtube.com/embed/${product.video.youtubeId}`}
                    title="Product Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">
              Related Products
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

export default ProductDetailPage;
