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

// Floating WhatsApp Icon
const FloatingWhatsApp = () => (
  <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
    {/* Ping effect behind the button */}
    <div className="absolute w-12 h-12 bg-[#25D366] rounded-full animate-ping opacity-60"></div>

    <a
      href="https://wa.me/918778468360"
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
      style={{ width: "48px", height: "48px" }}
      aria-label="Chat on WhatsApp"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: "28px", height: "28px" }}
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297C18.22 1.24 15.228 0 12.046 0 5.426 0 .041 5.385.039 12.005c0 2.118.552 4.186 1.602 6.002L0 24l6.14-1.61c1.748.956 3.722 1.459 5.733 1.46h.005c6.619 0 12.004-5.384 12.006-12.004a11.97 11.97 0 00-3.52-8.459" />
      </svg>
    </a>
  </div>
);

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
              <FloatingWhatsApp />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
