import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Package,
  MapPin,
  Receipt,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import api from "../services/api";

const STATUS_MAP = {
  processing: { label: "Processing", color: "text-blue-400 bg-blue-500/10" },
  packed: { label: "Packed", color: "text-purple-400 bg-purple-500/10" },
  shipped: { label: "Shipped", color: "text-amber-400 bg-amber-500/10" },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10" },
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
      <div className="flex justify-center items-center min-h-96" style={{ background: "#0a0814" }}>
        <div className="w-10 h-10 rounded-full border-4 border-surface-2 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen py-10 relative" style={{ background: "#0a0814" }}>
      {/* 🎇 Full-page fireworks animation */}
      <CrackerBurst />

      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 relative z-10 animate-fade-in-up">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-white mb-1">
            Order Placed! 🎇
          </h1>
          <p className="text-gray-400">Your products are on their way!</p>
          {order?.invoiceNo && (
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Invoice: {order.invoiceNo}
            </p>
          )}
        </div>

        {order && (
          <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
            {/* Order Status */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Package className="w-4 h-4 text-primary" />
                <span>Order Status</span>
              </div>
              <span
                className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md ${STATUS_MAP[order.orderStatus]?.color || "text-gray-400 bg-surface-2"}`}
              >
                {STATUS_MAP[order.orderStatus]?.label}
              </span>
            </div>

            {/* Items */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <h3 className="font-semibold text-sm text-gray-300 mb-3">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-gray-400 text-xs">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-white">
                      ₹{item.subtotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
                <h3 className="font-semibold text-sm text-gray-300 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                <p className="text-sm text-white">
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

            {/* Payment Instructions */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <h3 className="font-semibold text-sm text-gray-300 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Instructions
              </h3>
              
              <div className="bg-[#1a1726] p-4 rounded-xl border border-gray-800 mb-4">
                <p className="text-sm text-gray-300 mb-3">Please transfer the total amount via Google Pay to either of the numbers below:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-base tracking-wide">+91 97896 92606</span>
                    <span className="text-sm text-gray-400">— Alagarsamy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-base tracking-wide">+91 88386 96953</span>
                    <span className="text-sm text-gray-400">— Hari Prasath</span>
                  </div>
                </div>
              </div>

              <a 
                href="https://wa.me/919789692606" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 transition-all hover:bg-green-500/10"
                style={{ borderColor: "#25D366", color: "#25D366" }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <span className="font-bold">Send Payment Screenshot to WhatsApp</span>
              </a>

              {order.paymentStatus === "pending" ? (
                <p className="text-xs text-yellow-500 font-medium mt-3 text-center">
                  * Order will be processed once payment is verified
                </p>
              ) : (
                <p className="text-xs text-green-400 font-bold mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Payment Verified
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="px-6 py-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              {order.slabDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span className="flex items-center gap-1">
                    Slab Discount
                    {order.slabLabel && (
                      <span className="text-gray-400 text-xs">({order.slabLabel})</span>
                    )}
                  </span>
                  <span className="font-bold">−₹{order.slabDiscount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              {order.discount > 0 && !order.slabDiscount && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-base text-white pt-3" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <span>{order.paymentStatus === "paid" ? "Total Paid" : "Total Payable"}</span>
                <div className="text-right">
                  <span className="text-primary">₹{order.finalPayable?.toLocaleString("en-IN")}</span>

                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            to="/orders"
            className="btn-fire flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold"
          >
            <Receipt className="w-4 h-4" /> My Orders
          </Link>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-primary rounded-xl font-semibold transition-colors"
            style={{ border: "2px solid rgba(255,102,0,0.3)", background: "rgba(255,102,0,0.05)" }}
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
