import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Package,
  MapPin,
  Receipt,
  ArrowRight,
} from "lucide-react";
import api from "../services/api";

const STATUS_MAP = {
  processing: { label: "Processing", color: "badge-processing" },
  packed: { label: "Packed", color: "badge-packed" },
  shipped: { label: "Shipped", color: "badge-shipped" },
  delivered: { label: "Delivered", color: "badge-delivered" },
  cancelled: { label: "Cancelled", color: "badge-cancelled" },
};

const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-surface py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Order Placed! 🎆
          </h1>
          <p className="text-gray-500">Your crackers are on their way!</p>
          {order?.invoiceNo && (
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Invoice: {order.invoiceNo}
            </p>
          )}
        </div>

        {order && (
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
            {/* Order Status */}
            <div className="px-6 py-4 border-b border-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-primary" />
                <span>Order Status</span>
              </div>
              <span
                className={STATUS_MAP[order.orderStatus]?.color || "badge-gray"}
              >
                {STATUS_MAP[order.orderStatus]?.label}
              </span>
            </div>

            {/* Items */}
            <div className="px-6 py-4 border-b border-orange-50">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-gray-400 text-xs">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">
                      ₹{item.subtotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="px-6 py-4 border-b border-orange-50">
                <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.fullName} ·{" "}
                  {order.shippingAddress.phone}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order.shippingAddress.addressLine1},{" "}
                  {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                  {order.shippingAddress.pincode}
                </p>
              </div>
            )}

            {/* Totals */}
            <div className="px-6 py-4 space-y-2 text-sm">
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-base text-gray-900 border-t border-orange-50 pt-3">
                <span>Total Paid</span>
                <span className="text-primary">₹{order.finalPayable}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            to="/orders"
            className="btn-fire flex-1 justify-center py-3 rounded-xl"
          >
            <Receipt className="w-4 h-4" /> My Orders
          </Link>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-white border-2 border-primary text-primary rounded-xl font-semibold hover:bg-surface transition-colors"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
