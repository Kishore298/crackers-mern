import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Flame, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#FF4500,#FF6B00)" }}
          >
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Join V Crackers – India's finest crackers
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
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
            ].map(({ id, label, type, icon: Icon, placeholder }) => (
              <div key={id}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={type}
                    required
                    value={form[id]}
                    onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                    placeholder={placeholder}
                    className="input-fire pl-10"
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  className="input-fire pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
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
              className="btn-fire w-full justify-center py-3.5 text-base rounded-xl mt-2"
            >
              {loading ? "Creating Account..." : "Create Account 🎆"}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-orange-50">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to={`/login${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                className="text-primary font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
