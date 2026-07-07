import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import AuthCard from "../components/AuthCard";
import AuthBanner from "../components/AuthBanner";
import SEO from "../components/SEO";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  // States
  const [step, setStep] = useState(1); // 1: Identifier, 2: Choose Method, 3: Password, 4: OTP
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!identifier) return toast.error("Please enter your phone number or email");
    setStep(2);
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/send-otp-whatsapp", { phone: identifier });
      if (data.success) {
        toast.success(data.message);
        setStep(4);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP. Try password login.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 🎇`);
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login-otp", { phone: identifier, otp });
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 🎇`);
        navigate(redirect);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const registerLink = `/register${redirect !== "/" ? `?redirect=${redirect}` : ""}`;

  /* Form panel content */
  let formContent;

  if (step === 1) {
    formContent = (
      <form onSubmit={handleNextStep} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Phone Number or Email
          </label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210"
              className="input-fire pl-11"
            />
          </div>
        </div>
        <button type="submit" className="btn-fire w-full py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/25">
          Continue <ArrowRight className="inline-block ml-2 w-4 h-4" />
        </button>
      </form>
    );
  } else if (step === 2) {
    formContent = (
      <div className="space-y-4">
        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all group"
          style={{ background: "rgba(34,197,94,0.05)", border: "2px solid rgba(34,197,94,0.15)" }}
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">WhatsApp OTP</p>
              <p className="text-xs text-green-400 font-medium">Fast & Secure Login</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setStep(3)}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all group hover:border-primary-light"
          style={{ background: "rgba(255,102,0,0.05)", border: "2px solid rgba(255,102,0,0.15)" }}
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">Password Login</p>
              <p className="text-xs text-primary font-medium">Standard Fallback</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </button>

        <button onClick={() => setStep(1)} className="w-full text-center text-sm font-semibold text-gray-400 hover:text-primary transition-colors pt-2">
          Change phone number
        </button>
      </div>
    );
  } else if (step === 3) {
    formContent = (
      <form onSubmit={handleLoginPassword} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <Link to="/forgot-password" size="sm" className="text-xs font-semibold text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type={showPwd ? "text" : "password"}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="***********"
              className="input-fire pl-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-fire w-full py-4 rounded-xl text-base font-bold shadow-lg mt-2">
          {loading ? "Signing in..." : "Login to Account"}
        </button>
        <button onClick={() => setStep(2)} className="w-full text-center text-sm font-semibold text-gray-400 hover:text-primary">
          Back to methods
        </button>
      </form>
    );
  } else if (step === 4) {
    formContent = (
      <form onSubmit={handleLoginOtp} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
            Enter 6-Digit OTP from WhatsApp
          </label>
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              maxLength="6"
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="0 0 0 0 0 0"
              className="input-fire pl-11 pr-4 text-center text-2xl font-black tracking-[0.5em] focus:border-green-500 focus:ring-green-500/10"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-base font-bold shadow-lg shadow-green-500/25">
          {loading ? "Verifying..." : "Verify & Login"}
        </button>
        <div className="text-center space-y-3">
          <button type="button" onClick={handleSendOtp} className="text-sm font-bold text-green-500 hover:underline">
            Resend OTP
          </button>
          <p className="text-xs text-gray-400">Didn't receive? <button type="button" onClick={() => setStep(3)} className="text-primary font-bold">Use Password instead</button></p>
        </div>
      </form>
    );
  }

  const formPanel = (
    <>
      <div className="mb-10 text-center md:text-left">
        <h1 className="font-heading font-black text-4xl text-white mb-2">
          {step === 4 ? "Verify OTP" : "Welcome back!"}
        </h1>
        <p className="text-gray-400 text-sm">
          {step === 4
            ? `We've sent a code to ${identifier}`
            : "Sign in to your account with India's most loved festive brand."}
        </p>
      </div>

      {formContent}

      <p className="mt-10 pt-6 text-sm text-center text-gray-400" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        Don't have an account?{" "}
        <Link to={registerLink} className="text-primary font-bold hover:underline">
          Create Account
        </Link>
      </p>
    </>
  );

  const bannerPanel = (
    <AuthBanner
      title={"Secure Login\nMade Simple."}
      subtitle="Now login faster with WhatsApp OTP. No more forgotten passwords!"
      // tagline="New Feature 🚀"
      // tags={["#WhatsAppLogin", "#FastCheckout"]}
      align="left"
    />
  );

  return (
    <>
      <SEO title="Login" description="Log in to your V Crackers account to track orders and manage your profile." />
      <AuthCard
        pageKey="login"
        direction={-1}
        formSide="left"
        formPanel={formPanel}
        bannerPanel={bannerPanel}
      />
    </>
  );
};

export default LoginPage;
