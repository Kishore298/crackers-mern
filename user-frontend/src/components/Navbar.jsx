import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Flame,
  LogOut,
  ChevronDown,
  Package,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { itemCount, total } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const categories = [
    "Rockets",
    "Sparklers",
    "Flower Pots",
    "Gift Boxes",
    "Ground Chakkar",
    "Sky Shots",
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[85px] md:h-[120px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/v-crackers-logo.png"
              alt="V Crackers"
              className="h-[80px] md:h-[120px] w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-md font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-md font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Products
            </Link>
            {categories.slice(0, 3).map((c) => (
              <Link
                key={c}
                to={`/products?category=${c.toLowerCase().replace(" ", "-")}`}
                className="text-md font-medium text-gray-700 hover:text-primary transition-colors"
              >
                {c}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 md:gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-1.5 hover:bg-surface rounded-xl transition-colors flex flex-col items-center min-w-[48px]"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-gray-700" />
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
              <span className="text-[10px] font-black text-primary mt-1 leading-none">
                ₹{total}
              </span>
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors text-sm font-medium text-gray-700"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden sm:block text-xs md:text-sm">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-6 h-6" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-orange-100 py-1 z-50">
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm text-gray-700 hover:bg-surface hover:text-primary transition-colors"
                    >
                      <Package className="w-5 h-5" /> My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm text-gray-700 hover:bg-surface hover:text-primary transition-colors"
                    >
                      <User className="w-5 h-5" /> Profile
                    </Link>
                    <div className="border-t border-orange-50 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-fire text-md px-4 py-2">
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
          <div className="md:hidden border-t border-orange-50 py-4 space-y-2">
            {[
              "Home",
              "Products",
              "Rockets",
              "Sparklers",
              "Flower Pots",
              "Gift Boxes",
            ].map((item) => (
              <Link
                key={item}
                to={
                  item === "Home"
                    ? "/"
                    : item === "Products"
                      ? "/products"
                      : `/products?category=${item.toLowerCase().replace(" ", "-")}`
                }
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-surface rounded-lg transition-colors"
              >
                {item}
              </Link>
            ))}
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
