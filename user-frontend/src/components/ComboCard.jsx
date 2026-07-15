import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const ComboCard = ({ combo, discountPct = 0 }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const FORCE_COMING_SOON = true;
  const isAvailable = !FORCE_COMING_SOON && combo.stock > 0;

  const basePrice = combo.price;
  const effectivePrice = combo.price;
  const showDiscount = false;
  const displayPct = 0;

  const handleAdd = () => {
    addToCart({ ...combo, effectivePrice }, qty);
    setQty(1);
  };

  const maxQty = combo.stock || 1;

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
        to={`/combos/${combo.slug}`}
        className="relative overflow-hidden block aspect-[16/9] md:aspect-[3/2]"
        style={{ background: "#0f0d1a" }}
      >
        {combo.images?.[0]?.url ? (
          <img
            src={combo.images[0].url?.replace("/upload/", "/upload/q_auto,f_auto,w_600/")}
            alt={combo.name}
            crossOrigin="anonymous"
            width={400}
            height={300}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-extrabold text-white shadow shadow-yellow-500/50"
            style={{
              background: "linear-gradient(140deg, #d4af37, #ffcc33, #d4af37)",
              color: "#4a3200"
            }}
          >
            COMBO PACK
          </span>
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
      <div className="p-3 md:p-5 flex flex-col flex-1 gap-2 md:gap-3">
        <Link to={`/combos/${combo.slug}`}>
          <h3 className="font-heading font-bold text-white text-sm sm:text-base md:text-lg leading-snug hover:text-primary transition-colors line-clamp-2">
            {combo.name}
          </h3>
        </Link>

        {/* {product.category?.name && (
          <span className="text-xs text-gray-400 font-medium">
            {product.category.name}
          </span>
        )} */}

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
          {isAvailable && combo.stock <= 10 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
              Only {combo.stock} left!
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
          <div className="flex items-center gap-1 md:gap-2 mt-1">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,102,0,0.15)" }}>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-6 h-8 md:w-8 md:h-9 flex items-center justify-center text-gray-400 hover:bg-surface-2 transition-colors"
              >
                <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>

              <span className="w-6 md:w-8 text-center text-sm font-bold text-white">
                {qty}
              </span>

              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                aria-label="Increase quantity"
                className="w-6 h-8 md:w-8 md:h-9 flex items-center justify-center text-gray-400 hover:bg-surface-2 transition-colors"
              >
                <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAdd}
              aria-label={`Add ${combo.name} to cart`}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 rounded-xl text-[10px] md:text-md lg:text-lg font-semibold transition-all duration-200 text-white"
              style={{
                background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
              }}
            >
              <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
              Add
            </button>
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

export default ComboCard;
