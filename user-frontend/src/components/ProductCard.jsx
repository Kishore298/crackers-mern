import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, discountPct = 0 }) => {
  const { addToCart } = useCart();

  // effectivePrice: apply global discount to base price
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

  const handleAdd = () => {
    addToCart({ ...product, effectivePrice }, 1);
  };

  return (
    <div className="group bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-primary-lg hover:-translate-y-1 transition-all duration-250 overflow-hidden flex flex-col">
      {/* Image */}
      <Link
        to={`/products/${product.slug}`}
        className="relative overflow-hidden block aspect-square bg-surface"
      >
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #FFE4D0 0%, #FFB347 60%, #FF6B00 100%)",
            }}
          />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {showDiscount && displayPct > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg,#FF4500,#FF6B00)" }}
            >
              -{displayPct}%
            </span>
          )}
          {product.stock <= 10 && product.stock > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              Few left!
            </span>
          )}
          {product.stock === 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-gray-900 text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.category?.name && (
          <span className="text-xs text-gray-400 font-medium">
            {product.category.name}
          </span>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-lg font-bold text-primary">
            ₹{effectivePrice}
          </span>
          {showDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{basePrice}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          style={
            product.stock > 0
              ? {
                  background: "linear-gradient(135deg,#FF4500,#FF6B00)",
                  color: "#fff",
                }
              : { background: "#f3f4f6", color: "#9ca3af" }
          }
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
