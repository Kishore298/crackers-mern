import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import PosPage from "./pages/PosPage";
import StockPage from "./pages/StockPage";
import DiscountPage from "./pages/DiscountPage";
import BannersPage from "./pages/BannersPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProductPerformancePage from "./pages/ProductPerformancePage";
import "./index.css";

const PrivateRoute = ({ children }) => {
  const { admin } = useAdminAuth();
  return admin ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { admin } = useAdminAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={admin ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="discount" element={<DiscountPage />} />
        {/* <Route path="banners" element={<BannersPage />} /> */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="product-analytics" element={<ProductPerformancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "10px", fontFamily: "Inter, sans-serif" },
          }}
        />
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
