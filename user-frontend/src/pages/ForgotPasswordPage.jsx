import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const STEPS = ["Email", "OTP", "New Password"];

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  /* Step 1 — Request OTP */
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent! Check your email inbox.");
      setStep(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 — Verify OTP */
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      toast.success("OTP verified! Set your new password.");
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* Step 3 — Reset Password */
  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, password });
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
            }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-heading font-black text-2xl text-gray-900 mb-2">
            Password Reset! 🎆
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <Link
            to="/login"
            className="btn-fire w-full py-3 rounded-xl text-sm font-bold inline-block text-center"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
            }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-black text-3xl text-gray-900">
            Forgot Password?
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            We'll send an OTP to your email to verify it's you.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  i <= step
                    ? {
                        background:
                          "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                        color: "#fff",
                      }
                    : { background: "#f3f4f6", color: "#9ca3af" }
                }
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 h-0.5 transition-all"
                  style={{ background: i < step ? "#ff6600" : "#e5e7eb" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* ── Step 0: Email ── */}
          {step === 0 && (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-fire w-full py-3.5 rounded-xl text-base font-bold"
              >
                {loading ? "Sending OTP…" : "Send OTP 📧"}
              </button>
            </form>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div className="text-center text-sm text-gray-500 bg-orange-50 rounded-xl p-3 mb-2">
                OTP sent to <strong>{email}</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter OTP from email"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-center text-xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-fire w-full py-3.5 rounded-xl text-base font-bold"
              >
                {loading ? "Verifying…" : "Verify OTP ✓"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setOtp("");
                }}
                className="w-full text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change email
              </button>
            </form>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-fire w-full py-3.5 rounded-xl text-base font-bold"
              >
                {loading ? "Resetting…" : "Reset Password 🔐"}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Remember your password?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
