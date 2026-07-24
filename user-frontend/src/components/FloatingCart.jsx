import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";

const FloatingCart = () => {
  const { itemCount, total, slabDiscount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Track previous itemCount to detect transitions
  const prevCountRef = useRef(itemCount);
  const [visible, setVisible] = useState(itemCount > 0);
  const [animClass, setAnimClass] = useState("");
  // Track total changes for the slide-up animation
  const [displayTotal, setDisplayTotal] = useState(total);
  const [totalAnimating, setTotalAnimating] = useState(false);

  // Hide on cart and checkout pages
  const hiddenPaths = ["/cart", "/checkout"];
  const isHidden = hiddenPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  useEffect(() => {
    const prevCount = prevCountRef.current;
    prevCountRef.current = itemCount;

    if (itemCount > 0 && prevCount === 0) {
      // First item added — pop in
      setVisible(true);
      setAnimClass("floating-cart-pop-in");
    } else if (itemCount === 0 && prevCount > 0) {
      // Cart emptied — fade out, then hide
      setAnimClass("floating-cart-fade-out");
      const timer = setTimeout(() => {
        setVisible(false);
        setAnimClass("");
      }, 200);
      return () => clearTimeout(timer);
    } else if (itemCount > 0) {
      setVisible(true);
    }
  }, [itemCount]);

  // Animate total changes
  useEffect(() => {
    if (total !== displayTotal) {
      setTotalAnimating(true);
      const timer = setTimeout(() => {
        setDisplayTotal(total);
        setTotalAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [total, displayTotal]);

  if (!visible || isHidden) return null;

  return (
    <div
      className="fixed z-[85]"
      style={{
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <div className={animClass}>
        <button
          onClick={() => navigate("/cart")}
          className="floating-cart-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 22px",
            borderRadius: "60px",
            background: "linear-gradient(90deg, #ff8b2b, #ff5a00)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow:
              "0 8px 32px rgba(255, 90, 0, 0.35), 0 2px 8px rgba(0,0,0,0.3)",
            fontFamily: "Inter, system-ui, sans-serif",
            whiteSpace: "nowrap",
            minWidth: "max-content",
          }}
        >
          {/* Cart icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShoppingCart
              style={{ width: "18px", height: "18px", color: "#fff" }}
            />
          </div>

          {/* Text content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              View Cart
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, opacity: 0.9 }}>
                {itemCount} {itemCount === 1 ? "Item" : "Items"} •{" "}
                <span
                  className={totalAnimating ? "floating-cart-total-update" : ""}
                  style={{ fontWeight: 700 }}
                >
                  ₹{displayTotal.toLocaleString("en-IN")}
                </span>
              </span>
            </div>
            {slabDiscount > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#d4ffcc",
                  letterSpacing: "0.2px",
                }}
              >
                You Save ₹{slabDiscount.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight
            style={{
              width: "18px",
              height: "18px",
              color: "#fff",
              opacity: 0.7,
              flexShrink: 0,
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default FloatingCart;
