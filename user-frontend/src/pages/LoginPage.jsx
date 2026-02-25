import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import AuthCard from "../components/AuthCard";
import AuthBanner from "../components/AuthBanner";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 🎆`);
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const registerLink = `/register${redirect !== "/" ? `?redirect=${redirect}` : ""}`;

  /* ── Form panel ─────────────────────────────────────────── */
  const formPanel = (
    <>
      <div className="mb-8">
        <h1 className="font-heading font-black text-3xl text-gray-900 mb-1">
          Welcome back!
        </h1>
        <p className="text-gray-500 text-sm">
          Sign in to your{" "}
          <span className="text-primary font-semibold">V Crackers</span>{" "}
          account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identifier — email or phone */}
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
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="you@example.com or 9876543210"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type={showPwd ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          {loading ? "Signing in…" : "Login to Account 🎆"}
        </button>
      </form>

      {/* Toggle link */}
      <p className="mt-8 pt-6 border-t border-gray-100 text-sm text-center text-gray-500">
        Don't have an account?{" "}
        <Link
          to={registerLink}
          className="text-primary font-bold underline md:no-underline md:hover:underline"
        >
          Create Account
        </Link>
      </p>
    </>
  );

  /* ── Banner panel ────────────────────────────────────────── */
  const bannerPanel = (
    <AuthBanner
      title={"Light up your\ncelebrations."}
      subtitle="Experience the magic of premium fireworks with India's most trusted brand."
      tagline="Welcome back"
      tags={["#VCrackers", "#Diwali2026"]}
      align="left"
    />
  );

  return (
    <AuthCard
      pageKey="login"
      direction={-1}
      formSide="left"
      formPanel={formPanel}
      bannerPanel={bannerPanel}
    />
  );
};

export default LoginPage;
