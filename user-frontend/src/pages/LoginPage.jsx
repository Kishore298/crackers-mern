import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
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

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);

  // Background check for existing user
  const handlePhoneChange = async (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    if (raw.length === 10) {
      try {
        const { data } = await api.post("/auth/check-phone", { phone: raw });
        setIsNewUser(!data.exists);
      } catch (err) {
        // silently ignore error on check
      }
    } else {
      setIsNewUser(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error("Please enter your phone number");
    
    // basic validation
    if (phone.replace(/\D/g, "").length < 10) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    setLoading(true);
    try {
      if (isNewUser) {
        if (!name.trim()) return toast.error("Please enter your name");
        const { data } = await api.post("/auth/register-phone", { phone, name });
        if (data.success) {
          login(data.user, data.token);
          toast.success(`Welcome to VCrackers, ${data.user.name.split(" ")[0]}! 🎇`);
          navigate(redirect);
        }
      } else {
        const { data } = await api.post("/auth/login-phone", { phone });
        if (data.success) {
          login(data.user, data.token);
          toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 🎇`);
          navigate(redirect);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const formPanel = (
    <>
      <div className="mb-10 text-center md:text-left">
        <h1 className="font-heading font-black text-4xl text-white mb-2">
          Welcome!
        </h1>
        <p className="text-gray-400 text-sm">
          Enter your mobile number to sign in or create an account instantly.
        </p>
      </div>

        <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Mobile Number
          </label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. 9876543210"
              className="input-fire pl-11"
            />
          </div>
        </div>

        {isNewUser && (
          <div className="animate-fade-in-up">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="input-fire px-4"
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="btn-fire w-full py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {loading ? "Please wait..." : (
            <>
              Continue <ArrowRight className="inline-block ml-2 w-4 h-4" />
            </>
          )}
        </button>
      </form>
      
      <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <p className="text-xs text-primary-light font-medium">
          No passwords required! A secure session is created instantly.
        </p>
      </div>
    </>
  );

  return (
    <>
      <SEO 
        title="Login | V Crackers" 
        description="Login or register instantly using your mobile number." 
      />
      <AuthCard
        pageKey="login"
        direction={1}
        formSide="right"
        formPanel={formPanel}
        bannerPanel={<AuthBanner />}
      />
    </>
  );
};

export default LoginPage;
