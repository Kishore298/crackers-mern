import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useAdminAuth, api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.success && data.user.role === "admin") {
        login(data.user, data.token);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        toast.error("Access denied. Admin only.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white">
        {/* ── Form Side ── */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-14 py-12">
          <div className="mb-8">
            <h1 className="font-heading font-black text-3xl text-gray-900 mb-1">
              Admin Panel
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to manage{" "}
              <span className="text-primary font-semibold">V Crackers</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Email or Phone
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={form.identifier}
                  onChange={(e) =>
                    setForm({ ...form, identifier: e.target.value })
                  }
                  placeholder="you@example.com or 9876543210"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-fire w-full py-3.5 rounded-xl text-base font-bold shadow-lg shadow-primary/25 mt-2"
            >
              {loading ? "Signing in…" : "Sign In to Admin Panel 🎆"}
            </button>
          </form>

          <p className="mt-8 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
            © {new Date().getFullYear()} V Crackers. All rights reserved.
          </p>
        </div>

        {/* ── Banner Side ── */}
        <div className="hidden md:flex w-1/2 relative overflow-hidden">
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(140deg, #8b0000 0%, #ff6600 50%, #ffcc33 100%)",
            }}
          />
          {/* Glow blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

          {/* Sparkle dots */}
          {[
            { top: "15%", left: "12%", size: 6 },
            { top: "35%", right: "10%", size: 4 },
            { bottom: "25%", left: "20%", size: 5 },
            { bottom: "15%", right: "25%", size: 3 },
            { top: "60%", left: "8%", size: 4 },
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/40"
              style={{
                width: dot.size,
                height: dot.size,
                top: dot.top,
                left: dot.left,
                right: dot.right,
                bottom: dot.bottom,
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 py-10 text-white gap-5">
            <img
              src="/v-crackers-logo.png"
              alt="V Crackers"
              className="h-32 w-auto object-contain brightness-0 invert opacity-90"
            />
            <div className="w-10 h-1 rounded-full bg-white/60" />
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
                Admin Dashboard
              </p>
              <h2 className="font-heading font-black text-3xl xl:text-4xl leading-tight mb-3">
                Manage your{"\n"}Empire.
              </h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-[280px]">
                Customers, Products, Orders, Discounts — everything you need in
                one place.
              </p>
              <div className="flex gap-3 mt-5 flex-wrap justify-center">
                {["#VCrackers", "#AdminPanel", "#Diwali"].map((t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold text-white/60 bg-white/10 rounded-full px-3 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
