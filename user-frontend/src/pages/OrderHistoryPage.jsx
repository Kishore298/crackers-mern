import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const statusConfig = {
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-blue-600 bg-blue-50",
  },
  packed: {
    label: "Packed",
    icon: Package,
    color: "text-purple-600 bg-purple-50",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-amber-600 bg-amber-50",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 bg-red-50",
  },
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/orders");
      return;
    }
    const fetch = async () => {
      try {
        const { data } = await api.get("/orders");
        setOrders(data.orders || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-6">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-orange-100 py-20 text-center">
            <ShoppingBag className="w-16 h-16 text-orange-200 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg text-gray-700 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Start shopping and your orders will appear here
            </p>
            <Link to="/products" className="btn-fire px-6 py-3 rounded-xl">
              Shop Now 🎆
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st =
                statusConfig[order.orderStatus] || statusConfig.processing;
              const StatusIcon = st.icon;
              return (
                <Link
                  key={order._id}
                  to={`/order-success/${order._id}`}
                  className="block bg-white rounded-2xl border border-orange-100 p-5 hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">
                          {order.invoiceNo}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}
                        >
                          <StatusIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                        <span>{order.items?.length} item(s)</span>
                        <span>·</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                        <span>·</span>
                        <span className="capitalize">
                          {order.paymentMethod} payment
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className="text-xs bg-surface px-2 py-1 rounded-lg text-gray-600"
                          >
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-primary text-lg">
                        ₹{order.finalPayable}
                      </p>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors mt-1 ml-auto" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
