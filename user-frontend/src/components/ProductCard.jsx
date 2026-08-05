import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const ProductCard = ({ product, discountPct = 0 }) => {
  const { addToCart, getCartItem, updateQty } = useCart();
  const cartItem = getCartItem(product._id);
  const FORCE_COMING_SOON = false;
  const isAvailable = !FORCE_COMING_SOON && product.stock > 0;

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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group rounded-2xl transition-shadow duration-250 overflow-hidden flex flex-col"
      style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}
    >
      {/* Image */}
      <Link
        to={`/products/${product.slug}`}
        className="relative overflow-hidden block aspect-[4/3]"
        style={{ background: "#0f0d1a" }}
      >
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url?.replace("/upload/", "/upload/q_auto,f_auto,w_400/")}
            alt={product.name}
            crossOrigin="anonymous"
            width={240}
            height={180}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 bg-[#0f0d1a]">
            <img 
              src="/v-crackers-logo.webp" 
              alt="V Crackers Logo" 
              className="w-full h-full object-contain opacity-20 filter grayscale" 
            />
          </div>
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
          <h3 className="font-heading font-semibold text-white text-xs sm:text-sm md:text-base leading-snug hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* {product.category?.name && (
          <span className="text-xs text-gray-400 font-medium">
            {product.category.name}
          </span>
        )} */}

        {/* Pricing */}
        <div className="flex items-center gap-1 mt-auto">
          <span className="text-xs md:text-base font-bold text-primary">
            ₹{effectivePrice}
          </span>
          {showDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₹{basePrice}
            </span>
          )}
          {isAvailable && product.stock <= 10 && (
            <span className="ml-auto text-[10px] sm:text-xs font-semibold text-red-500">
              Only {product.stock} left!
            </span>
          )}
          {!isAvailable && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
              Coming soon
            </span>
          )}
        </div>

        {/* Quantity + Add to Cart */}
        {isAvailable ? (
          <div className="mt-1 w-full h-8 md:h-9">
            {cartItem ? (
              <div className="flex items-center justify-between rounded-xl overflow-hidden bg-dark-card h-full w-full" style={{ border: "1px solid rgba(255,102,0,0.3)" }}>
                <button
                  type="button"
                  onClick={() => updateQty(product._id, cartItem.quantity - 1)}
                  aria-label="Decrease quantity"
                  className="w-10 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center text-sm font-bold text-white">
                  {cartItem.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(product._id, cartItem.quantity + 1)}
                  aria-label="Increase quantity"
                  className="w-10 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                className="flex items-center justify-center gap-1.5 w-full h-full rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-white"
                style={{
                  background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold mt-1 opacity-50 cursor-not-allowed"
            style={{ background: "#1a1726", color: "#555" }}
          >
            <ShoppingCart className="w-4 h-4" />
            Coming soon
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
