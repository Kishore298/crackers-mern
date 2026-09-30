import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Globe, Monitor, ArrowRight } from "lucide-react";
import api from "../services/api";

const ReviewCard = ({ review }) => {
  const initial = (review.customerName || "C").charAt(0).toUpperCase();
  const colors = [
    "from-red-500 to-orange-500",
    "from-orange-500 to-amber-500",
    "from-emerald-500 to-teal-500",
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
  ];
  const colorIdx =
    (review.customerName || "").charCodeAt(0) % colors.length;

  return (
    <div
      className="flex-shrink-0 w-[300px] sm:w-[340px] p-5 rounded-2xl snap-start"
      style={{
        background: "#13111f",
        border: "1px solid rgba(255,102,0,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold text-sm`}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {review.customerName}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
            review.source === "google"
              ? "bg-blue-900/30 text-blue-300"
              : "bg-orange-900/30 text-orange-300"
          }`}
        >
          {review.source === "google" ? (
            <Globe className="w-2.5 h-2.5" />
          ) : (
            <Monitor className="w-2.5 h-2.5" />
          )}
          {review.source === "google" ? "Google" : "Website"}
        </span>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= review.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
          "{review.comment}"
        </p>
      )}
    </div>
  );
};

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ googleReviewUrl: "" });
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get("/reviews/public?limit=20");
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/settings");
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        // silent
      }
    };

    fetchReviews();
    fetchSettings();
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 360;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading || (!reviews.length && !stats)) return null;

  const avg = stats?.averageRating
    ? Math.round(stats.averageRating * 10) / 10
    : 0;

  return (
    <section className="w-full md:max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p
            className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: "#ff6600" }}
          >
            Customer Reviews
          </p>
          <h2 className="font-heading font-black text-white text-2xl sm:text-3xl leading-tight">
            What Our Customers Say 💬
          </h2>

          {stats && stats.totalReviews > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-3xl font-bold text-white">{avg}</span>
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  Based on{" "}
                  <span className="text-white font-semibold">
                    {stats.totalReviews}
                  </span>{" "}
                  reviews
                </p>
                <p className="text-xs text-gray-500">
                  From website &amp; Google reviews
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll controls */}
          {reviews.length > 3 && (
            <div className="hidden sm:flex gap-1.5 mr-3">
              <button
                onClick={() => scroll("left")}
                className="w-9 h-9 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-9 h-9 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <Link
            to="/review"
            className="btn-fire px-5 py-2.5 rounded-xl text-sm"
          >
            Write a Review <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Review Cards Carousel */}
      {reviews.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
        </div>
      )}

      {/* CTA Row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        {settings.googleReviewUrl && (
          <a
            href={settings.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Rate us on Google
          </a>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
