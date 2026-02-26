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
      .catch(() => {});
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
    <header className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[70px] md:h-[100px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/v-crackers-logo.png"
              alt="V Crackers"
              className="h-[60px] md:h-[90px] w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
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
                className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
              >
                All Categories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              {catOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-orange-100 py-2 z-50 max-h-[70vh] overflow-y-auto">
                  <Link
                    to="/products"
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface transition-colors"
                  >
                    View All Products
                  </Link>
                  <div className="border-t border-orange-50 my-1" />
                  {otherCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/products?category=${cat._id}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-surface hover:text-primary transition-colors"
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full shrink-0"
                          style={{
                            background:
                              "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                          }}
                        />
                      )}
                      {cat.name}
                    </Link>
                  ))}
                  {giftCategory && (
                    <>
                      <div className="border-t border-orange-50 my-1" />
                      <Link
                        to={`/products?category=${giftCategory._id}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
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
                className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
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
              className="relative p-1.5 hover:bg-surface rounded-xl transition-colors flex flex-col items-center min-w-[44px]"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
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

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-surface transition-colors text-sm font-medium text-gray-700"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-xs">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-orange-100 py-1 z-50">
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface hover:text-primary transition-colors"
                    >
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <div className="border-t border-orange-50 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
              className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-orange-50 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-surface rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-surface rounded-lg transition-colors"
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-surface rounded-lg transition-colors"
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full shrink-0"
                        style={{
                          background:
                            "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                        }}
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
                className="flex items-center gap-2 mx-3 px-3 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
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
