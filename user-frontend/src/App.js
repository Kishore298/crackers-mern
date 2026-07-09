import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { HelmetProvider } from "react-helmet-async";
import PremiumExtras from "./components/PremiumExtras";
import "./index.css";

// Lazy loading pages for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductListPage = lazy(() => import("./pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));

// Static Trust Pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ShippingPolicyPage = lazy(() => import("./pages/ShippingPolicyPage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
const SafetyPolicyPage = lazy(() => import("./pages/SafetyPolicyPage"));



function App() {
  const [toastPosition, setToastPosition] = useState("bottom-right");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setToastPosition("top-right");
      } else {
        setToastPosition("bottom-right");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Toaster
                position={toastPosition}
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: "10px",
                    fontFamily: "Inter, sans-serif",
                    background: "#1a1726",
                    color: "#e5e5e5",
                    border: "1px solid rgba(255,102,0,0.15)",
                  },
                  success: {
                    iconTheme: { primary: "#ff6600", secondary: "#1a1726" },
                  },
                }}
              />
              <Navbar />
              <main className="min-h-screen bg-dark-bg">
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-[50vh]">
                      <div className="w-10 h-10 rounded-full border-4 border-dark-card-2 border-t-primary animate-spin" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route
                      path="/products/:slug"
                      element={<ProductDetailPage />}
                    />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route
                      path="/order-success/:id"
                      element={<OrderSuccessPage />}
                    />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />

                    {/* Trust / Static Pages */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                    <Route path="/refund-policy" element={<RefundPolicyPage />} />
                    <Route path="/safety-guidelines" element={<SafetyPolicyPage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <PremiumExtras />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
