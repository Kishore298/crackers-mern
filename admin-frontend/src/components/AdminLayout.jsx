import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingBag,
  Monitor,
  Archive,
  Percent,
  Image,
  BarChart2,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Users,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/users", icon: Users, label: "Customers" },
  { to: "/pos", icon: Monitor, label: "POS Billing" },
  { to: "/stock", icon: Archive, label: "Stock" },
  { to: "/discount", icon: Percent, label: "Discount" },
  { to: "/banners", icon: Image, label: "Banners" },
  { to: "/reports", icon: BarChart2, label: "Reports" },
];

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#1A0A00" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/v-crackers-logo.png"
              alt="V Crackers"
              className="h-14 md:h-20 w-auto object-contain"
            />

            {/* Admin Panel Text */}
            <span className="text-white font-semibold text-md md:text-base tracking-wide">
              Admin Panel
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link${isActive(to) ? " active" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {isActive(to) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{
                background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
              }}
            >
              {admin?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-lg text-gray-900 capitalize">
              {navItems.find((n) => isActive(n.to))?.label || "Dashboard"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
              style={{ background: "#FFF0E8", color: "#ff6600" }}
            >
              Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
