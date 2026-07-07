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
} from "lucide-react";
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
    <footer className="text-gray-300 pt-2 pb-6" style={{ background: "#080610" }}>
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 pt-10">
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
                    to={`/products?category=${cat._id}`}
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
                    to={`/products?category=${giftCategory._id}`}
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
                  V Crackers <br />
                  4/468-G, Sithalakshmi Nagar, <br />
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
  );
};

export default Footer;
