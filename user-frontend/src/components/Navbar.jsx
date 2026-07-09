import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Package,
  Gift,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import api from "../services/api";

const Navbar = () => {
  const { itemCount, total } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const catTimeout = useRef(null);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => { });
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  // Separate "Gift Boxes" from other categories
  const giftCategory = categories.find((c) =>
    c.name.toLowerCase().includes("gift"),
  );
  const otherCategories = categories.filter(
    (c) => !c.name.toLowerCase().includes("gift"),
  );

  // Hover handlers for desktop dropdown
  const openCat = () => {
    if (catTimeout.current) clearTimeout(catTimeout.current);
    setCatOpen(true);
  };
  const closeCat = () => {
    catTimeout.current = setTimeout(() => setCatOpen(false), 200);
  };

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm" style={{ background: "#0d0b1a", borderColor: "rgba(255,102,0,0.1)" }}>
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[64px] md:h-[94px]">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="V Crackers - Return to Home"
          >
            <img
              src="/v-crackers-logo.webp"
              alt="V Crackers Logo"
              width={60}
              height={60}
              className="h-[60px] md:h-[90px] w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold text-gray-300 hover:text-primary transition-colors"
            >
              Home
            </Link>

            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={openCat}
              onMouseLeave={closeCat}
            >
              <button
                onClick={() => setCatOpen(!catOpen)}
                aria-label="Toggle Categories Menu"
                className="flex items-center gap-1 text-sm font-semibold text-gray-300 hover:text-primary transition-colors"
              >
                All Categories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              {catOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-xl shadow-xl py-2 z-50 max-h-[70vh] overflow-y-auto" style={{ background: "#1a1726", border: "1px solid rgba(255,102,0,0.12)" }}>
                  <Link
                    to="/products"
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-2 transition-colors"
                  >
                    View All Products
                  </Link>
                  <div className="my-1" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }} />
                  {otherCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/products?category=${cat._id}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-surface-2 hover:text-primary transition-colors"
                    >
                      {cat.image ? (
                        <img
                          src={cat.image?.replace("/upload/", "/upload/q_auto,f_auto,w_50/")}
                          alt=""
                          crossOrigin="anonymous"
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full shrink-0"
                          style={{ background: "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)" }}
                        />
                      )}
                      {cat.name}
                    </Link>
                  ))}
                  {giftCategory && (
                    <>
                      <div className="my-1" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }} />
                      <Link
                        to={`/products?category=${giftCategory._id}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-surface-2 transition-colors"
                      >
                        <Gift className="w-4 h-4 text-amber-500" />
                        {giftCategory.name} 🎁
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Gift Boxes — separate prominent link */}
            {giftCategory && (
              <Link
                to={`/products?category=${giftCategory._id}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Gift className="w-4 h-4" />
                Gift Boxes
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-1.5 hover:bg-surface-2 rounded-xl transition-colors flex flex-col items-center min-w-[44px]"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-300" />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                    style={{
                      background:
                        "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                    }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black text-primary mt-0.5 leading-none">
                ₹{total}
              </span>
            </Link>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Open User Menu"
                  className="flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors text-sm font-medium text-gray-300"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-xs">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-lg py-1 z-50" style={{ background: "#1a1726", border: "1px solid rgba(255,102,0,0.12)" }}>
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-surface-2 hover:text-primary transition-colors"
                    >
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-surface-2 hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <div className="my-1" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-fire text-sm px-4 py-2">
                Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close Menu" : "Open Menu"}
              className="md:hidden p-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 space-y-1 max-h-[70vh] overflow-y-auto" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
            >
              All Products
            </Link>

            {/* Mobile categories — collapsible */}
            <div className="px-3 pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                Categories
              </p>
              <div className="space-y-0.5">
                {otherCategories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat._id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
                  >
                    {cat.image ? (
                      <img
                        src={cat.image?.replace("/upload/", "/upload/q_auto,f_auto,w_50/")}
                        alt=""
                        crossOrigin="anonymous"
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full shrink-0"
                        style={{ background: "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)" }}
                      />
                    )}
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Gift Boxes — highlighted */}
            {giftCategory && (
              <Link
                to={`/products?category=${giftCategory._id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 mx-3 px-3 py-2.5 text-sm font-semibold text-amber-400 rounded-lg transition-colors"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
              >
                <Gift className="w-4 h-4 text-amber-500" />
                {giftCategory.name} 🎁
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Click outside dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Navbar;
