import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import AuthCard from "../components/AuthCard";
import AuthBanner from "../components/AuthBanner";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      if (data.success) {
        login(data.user, data.token);
        toast.success("Account created! Welcome to V Crackers 🎆");
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const loginLink = `/login${redirect !== "/" ? `?redirect=${redirect}` : ""}`;

  /* ── Form panel ─────────────────────────────────────────── */
  const fields = [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      icon: User,
      placeholder: "Kishore S",
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      icon: Mail,
      placeholder: "you@example.com",
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      placeholder: "9876543210",
    },
  ];

  const formPanel = (
    <>
      <div className="mb-6">
        <h1 className="font-heading font-black text-3xl text-gray-900 mb-1">
          Create Account
        </h1>
        <p className="text-gray-500 text-sm">
          Join <span className="text-primary font-semibold">V Crackers</span> –
          India's finest crackers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ id, label, type, icon: Icon, placeholder }) => (
          <div key={id}>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              {label}
            </label>
            <div className="relative group">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type={type}
                required
                value={form[id]}
                onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
          </div>
        ))}

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type={showPwd ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
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
          className="btn-fire w-full py-3.5 rounded-xl text-base font-bold shadow-lg shadow-primary/25 mt-1"
        >
          {loading ? "Creating Account…" : "Create Account 🎆"}
        </button>
      </form>

      {/* Toggle link */}
      <p className="mt-6 pt-5 border-t border-gray-100 text-sm text-center text-gray-500">
        Already have an account?{" "}
        <Link
          to={loginLink}
          className="text-primary font-bold underline md:no-underline md:hover:underline"
        >
          Login
        </Link>
      </p>
    </>
  );

  /* ── Banner panel ────────────────────────────────────────── */
  const bannerPanel = (
    <AuthBanner
      title={"Join the\nfestive family."}
      subtitle="Exclusive deals, faster checkout, and order tracking — all in one place."
      tagline="New member"
      tags={["#SafetyFirst", "#PremiumQuality"]}
      align="right"
    />
  );

  return (
    <AuthCard
      pageKey="register"
      direction={1}
      formSide="right"
      formPanel={formPanel}
      bannerPanel={bannerPanel}
    />
  );
};

export default RegisterPage;
