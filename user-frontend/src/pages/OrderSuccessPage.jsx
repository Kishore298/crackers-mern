import React, { useEffect, useState, useRef } from "react";
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

/* ─── Fireworks / Cracker Burst Canvas ─── */
const CrackerBurst = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = [
      "#ff6600",
      "#ffcc33",
      "#8b0000",
      "#FF4500",
      "#FFD700",
      "#FF1493",
      "#00FF87",
      "#00BFFF",
      "#FF69B4",
      "#FFA500",
      "#7B68EE",
      "#00CED1",
      "#FF6347",
      "#32CD32",
    ];

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.size = Math.random() * 3 + 1.5;
        this.gravity = 0.04;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > 6) this.trail.shift();
        this.vx *= 0.985;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.beginPath();
          ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = t.alpha * 0.3 * (i / this.trail.length);
          ctx.fill();
        }
        // Main dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Rocket {
      constructor() {
        this.x = Math.random() * w * 0.6 + w * 0.2;
        this.y = h;
        this.targetY = Math.random() * h * 0.4 + h * 0.1;
        this.speed = Math.random() * 3 + 4;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.exploded = false;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();
        this.y -= this.speed;
        if (this.y <= this.targetY) {
          this.exploded = true;
        }
      }

      draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = (i / this.trail.length) * 0.6;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 1;
        ctx.fill();
      }
    }

    let particles = [];
    let rockets = [];
    let launchCount = 0;
    const maxLaunches = 12;

    const explode = (x, y, color) => {
      const count = Math.floor(Math.random() * 40) + 50;
      for (let i = 0; i < count; i++) {
        particles.push(
          new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]),
        );
      }
    };

    const launchRocket = () => {
      if (launchCount < maxLaunches) {
        rockets.push(new Rocket());
        launchCount++;
      }
    };

    // Launch rockets in bursts
    const intervals = [];
    for (let i = 0; i < 4; i++) {
      intervals.push(
        setTimeout(() => {
          launchRocket();
          launchRocket();
          launchRocket();
        }, i * 600),
      );
    }

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Update & draw rockets
      rockets = rockets.filter((r) => {
        r.update();
        if (r.exploded) {
          explode(r.x, r.y, r.color);
          return false;
        }
        r.draw(ctx);
        return true;
      });

      // Update & draw particles
      particles = particles.filter((p) => {
        p.update();
        if (p.alpha <= 0) return false;
        p.draw(ctx);
        return true;
      });

      // Keep animating while there's stuff to draw
      if (
        particles.length > 0 ||
        rockets.length > 0 ||
        launchCount < maxLaunches
      ) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      intervals.forEach(clearTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

export { CrackerBurst };

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
    <div className="min-h-screen bg-surface py-10 relative">
      {/* 🎆 Full-page fireworks animation */}
      <CrackerBurst />

      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 relative z-10">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
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
