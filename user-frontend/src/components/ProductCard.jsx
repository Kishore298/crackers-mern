import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const price = product.discountedPrice || product.price;
  const hasDiscount =
    product.discountedPrice && product.discountedPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.price - product.discountedPrice) / product.price) * 100,
      )
    : 0;

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
          <div className="w-full h-full flex items-center justify-center">
            <Zap className="w-16 h-16 text-orange-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {hasDiscount && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg,#FF4500,#FF6B00)" }}
            >
              -{discountPct}%
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
          <span className="text-lg font-bold text-primary">₹{price}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.price}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => addToCart(product, 1)}
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
