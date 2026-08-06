import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Gift,
  CreditCard,
} from "lucide-react";
import GPayIcon from "./GPayIcon";
import PhonePeIcon from "./PhonePeIcon";
import PaytmIcon from "./PaytmIcon";
import api from "../services/api";

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => { });
  }, []);

  const giftCategory = categories.find((c) =>
    c.name.toLowerCase().includes("gift"),
  );
  const otherCategories = categories.filter(
    (c) => !c.name.toLowerCase().includes("gift"),
  );

  return (
    <>
      {/* Payment Methods (Above Footer) */}
      <div className="w-full py-8 bg-[#13111f] border-t border-b border-white/5">
        <div className="w-full md:max-w-[98%] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-semibold text-white text-sm mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Options
              </h3>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <p className="text-xs text-gray-400">
                  We accept
                </p>
                <div className="flex items-center gap-2">
                  <GPayIcon className="w-12 h-8" />
                  <PhonePeIcon className="w-16 h-8" />
                  <PaytmIcon className="w-14 h-8" />
                </div>
                <p className="text-xs text-gray-400">
                  After placing your order, please transfer the amount to:
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                <p className="text-sm font-bold text-white tracking-wide">+91 97896 92606 <span className="text-xs text-gray-400 font-normal ml-1">— Alagarsamy</span></p>
                <p className="text-sm font-bold text-white tracking-wide">+91 88386 96953 <span className="text-xs text-gray-400 font-normal ml-1">— Hari Prasath</span></p>
              </div>
            </div>

            <a
              href="https://wa.me/918838696953"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-green-500/10 whitespace-nowrap shrink-0"
              style={{ borderColor: "#25D366", color: "#25D366" }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span className="font-bold text-sm">Send Payment Screenshot to WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <footer className="text-gray-300 pt-2 pb-6" style={{ background: "#080610" }}>
        <div className="w-full md:max-w-[98%] mx-auto px-4 sm:px-6 pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link
                to="/"
                className="flex items-center gap-2 mb-4"
                aria-label="V Crackers Home"
              >
                <img
                  src="/v-crackers-logo.webp"
                  alt="V Crackers Logo"
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-auto object-contain"
                />
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sivakasi's most trusted festive brand. Celebrate every moment
                with our premium quality celebration packs.
              </p>
              <div className="flex items-center gap-3 mt-5">
                {[
                  {
                    Icon: Facebook,
                    href: "https://www.facebook.com/share/18UMiW1MRr/",
                    color: "#316FF6",
                    label: "Facebook",
                  },
                  {
                    Icon: Instagram,
                    href: "https://www.instagram.com/v_crackers001?igsh=MzBydDUxMzhrM2hv",
                    color: "#E1306C",
                    label: "Instagram",
                  },
                  {
                    Icon: Youtube,
                    href: "https://youtube.com/@vcrackerssivakasi?si=tRhvgMfJgpWxoJB6",
                    color: "#FF0000",
                    label: "YouTube",
                  },
                ].map(({ Icon, href, color, label }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-heading font-semibold text-white text-sm mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {[
                  { label: "About Us", to: "/about" },
                  { label: "All Products", to: "/products" },
                  { label: "My Orders", to: "/orders" },
                  { label: "Cart", to: "/cart" },
                  { label: "Contact Us", to: "/contact" },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories — Dynamic */}
            <div className="col-span-1 lg:col-span-2">
              <h3 className="font-heading font-semibold text-white text-sm mb-4">
                Categories
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {otherCategories.map((cat) => (
                  <li key={cat._id}>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {/* Gift Boxes — highlighted */}
                {giftCategory && (
                  <li className="sm:col-span-2">
                    <Link
                      to={`/products?category=${giftCategory.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors mt-1"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {giftCategory.name} 🎁
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Policies (New) */}
            <div className="col-span-1">
              <h3 className="font-heading font-semibold text-white text-sm mb-4">
                Policies
              </h3>
              <ul className="space-y-2">
                {[
                  { label: "Privacy Policy", to: "/privacy-policy" },
                  { label: "Terms & Conditions", to: "/terms" },
                  { label: "Shipping Policy", to: "/shipping-policy" },
                  { label: "Cancellation & Refund", to: "/refund-policy" },
                  { label: "Safety Guidelines ★", to: "/safety-guidelines" },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1">
              <h3 className="font-heading font-semibold text-white text-sm mb-4">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <span className="leading-relaxed">
                    V Crackers, 4/468-G, <br />
                    Sithalakshmi Nagar, <br />
                    Kongalapuram, Sivakasi - 626123
                  </span>
                </li>
                <li className="flex items-start md:items-center gap-3 text-sm text-gray-400">
                  <Phone className="w-4 h-4 text-primary shrink-0 mt-1 md:mt-0" />
                  <div className="flex flex-wrap items-center gap-1">
                    <a
                      href="tel:+917824907916"
                      className="hover:text-primary transition-colors whitespace-nowrap"
                    >
                      +91 78249 07916,
                    </a>
                    <a
                      href="tel:+918778468360"
                      className="hover:text-primary transition-colors whitespace-nowrap"
                    >
                      +91 87784 68360
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href="mailto:vcrackerssivakasi@gmail.com"
                    className="hover:text-primary transition-colors break-all"
                  >
                    vcrackerssivakasi@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p>© {new Date().getFullYear()} V Crackers. All rights reserved.</p>
            <p>🎇 Celebrate responsibly. Keep products away from children.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
