import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AtSign } from "lucide-react";
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
    <div className="min-h-screen flex" style={{ background: "#0D0D0D" }}>
      {/* ── Left decorative panel ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{
          background:
            "linear-gradient(140deg, #8b0000 0%, #ff6600 50%, #ffcc33 100%)",
        }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-black/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        {/* Sparkle dots */}
        {[
          { top: "12%", left: "10%", size: 7 },
          { top: "38%", right: "12%", size: 5 },
          { bottom: "28%", left: "22%", size: 6 },
          { bottom: "14%", right: "20%", size: 4 },
          { top: "62%", left: "6%", size: 5 },
        ].map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{ width: d.size, height: d.size, ...d }}
          />
        ))}

        {/* Logo top */}
        <div className="relative z-10">
          <img
            src="/v-crackers-logo.png"
            alt="V Crackers"
            className="h-16 w-auto object-contain brightness-0 invert opacity-95"
          />
        </div>

        {/* Copy bottom */}
        <div className="relative z-10 text-white">
          <div className="w-10 h-1 rounded-full bg-white/60 mb-5" />
          <h2 className="font-heading font-black text-4xl leading-snug mb-3">
            Manage your
            <br />
            empire.
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-xs">
            Inventory, orders, discounts — everything you need to run V Crackers
            in one place.
          </p>
          <div className="flex gap-3 mt-6 flex-wrap">
            {["#VCrackers", "#AdminPanel", "#Diwali2026"].map((t) => (
              <span
                key={t}
                className="text-xs font-semibold bg-white/15 text-white/70 rounded-full px-3 py-1"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ─────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/v-crackers-logo.png"
              alt="V Crackers"
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#ff6600" }}
            >
              Admin Panel
            </p>
            <h1
              className="font-heading font-black text-3xl mb-1"
              style={{ color: "#F5F5F5" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Sign in with your admin email or phone number.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#9CA3AF" }}
              >
                Email or Phone
              </label>
              <div className="relative group">
                <AtSign
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: "#6B7280" }}
                />
                <input
                  type="text"
                  required
                  value={form.identifier}
                  onChange={(e) =>
                    setForm({ ...form, identifier: e.target.value })
                  }
                  placeholder="enter your email or phone number"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#1A1A1A",
                    border: "1.5px solid #2A2A2A",
                    color: "#F5F5F5",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1.5px solid #ff6600")
                  }
                  onBlur={(e) =>
                    (e.target.style.border = "1.5px solid #2A2A2A")
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#9CA3AF" }}
              >
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "#6B7280" }}
                />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#1A1A1A",
                    border: "1.5px solid #2A2A2A",
                    color: "#F5F5F5",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1.5px solid #ff6600")
                  }
                  onBlur={(e) =>
                    (e.target.style.border = "1.5px solid #2A2A2A")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#6B7280" }}
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all mt-2"
              style={{
                background: loading
                  ? "#CC3700"
                  : "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                boxShadow: "0 8px 32px rgba(255,69,0,0.30)",
              }}
            >
              {loading ? "Signing in…" : "Sign In to Admin Panel"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: "#4B5563" }}>
            © {new Date().getFullYear()} V Crackers. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
