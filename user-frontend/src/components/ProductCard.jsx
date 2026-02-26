import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const ProductCard = ({ product, discountPct = 0 }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

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
    addToCart({ ...product, effectivePrice }, qty);
    setQty(1);
  };

  const maxQty = product.stock || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-orange-100 shadow-sm transition-shadow duration-250 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <Link
        to={`/products/${product.slug}`}
        className="relative overflow-hidden block aspect-[4/3] bg-surface"
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
                "linear-gradient(135deg, #FFE4D0 0%, #FFB347 60%, #ff6600 100%)",
            }}
          />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {showDiscount && displayPct > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow"
              style={{
                background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
              }}
            >
              -{displayPct}%
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-2 md:p-4 flex flex-col flex-1 gap-1 md:gap-2">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-gray-900 text-xs sm:text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
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
          <span className="text-base font-bold text-primary">
            ₹{effectivePrice}
          </span>
          {showDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₹{basePrice}
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

        {/* Quantity + Add to Cart */}
        {product.stock > 0 ? (
          <div className="flex items-center gap-1 md:gap-2 mt-1">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-6 h-8 md:w-8 md:h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>

              <span className="w-6 md:w-8 text-center text-sm font-bold text-gray-800">
                {qty}
              </span>

              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="w-6 h-8 md:w-8 md:h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-white"
              style={{
                background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </button>
          </div>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold mt-1 opacity-50 cursor-not-allowed"
            style={{ background: "#f3f4f6", color: "#9ca3af" }}
          >
            <ShoppingCart className="w-4 h-4" />
            Out of Stock
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
