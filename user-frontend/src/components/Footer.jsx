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
      .catch(() => {});
  }, []);

  const giftCategory = categories.find((c) =>
    c.name.toLowerCase().includes("gift"),
  );
  const otherCategories = categories.filter(
    (c) => !c.name.toLowerCase().includes("gift"),
  );

  return (
    <footer className="bg-gray-950 text-gray-300 pt-14 pb-6">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/v-crackers-logo.png"
                alt="V Crackers"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sivakasi's most trusted fireworks brand. Celebrate every moment
              with our premium quality crackers since 2005.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Home", to: "/" },
                { label: "All Products", to: "/products" },
                { label: "My Orders", to: "/orders" },
                { label: "Cart", to: "/cart" },
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
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">
              Categories
            </h4>
            <ul className="space-y-2">
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
                <li>
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

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>
                  No. 45, Main Bazaar, Kovilpatti, Tamil Nadu – 628501
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="tel:+919876543210"
                  className="hover:text-primary transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="mailto:info@vcrackers.com"
                  className="hover:text-primary transition-colors"
                >
                  info@vcrackers.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} V Crackers. All rights reserved.</p>
          <p>🎆 Celebrate responsibly. Keep crackers away from children.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
