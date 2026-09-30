import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Send, CheckCircle, Edit3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

const ReviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [settings, setSettings] = useState({ googleReviewUrl: "" });

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/review");
      return;
    }

    // Fetch existing review
    const fetchExisting = async () => {
      try {
        const { data } = await api.get("/reviews/mine");
        if (data.review) {
          setExistingReview(data.review);
          setRating(data.review.rating);
          setComment(data.review.comment || "");
        }
      } catch (err) {
        // no existing review
      } finally {
        setCheckingExisting(false);
      }
    };

    // Fetch settings for Google review URL
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/settings");
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        // ignore
      }
    };

    fetchExisting();
    fetchSettings();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please select a rating");

    setLoading(true);
    try {
      const { data } = await api.post("/reviews", { rating, comment });
      if (data.success) {
        setSubmitted(true);
        setExistingReview(data.review);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-dark-card-2 border-t-primary animate-spin" />
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <>
        <SEO
          title="Thank You | V Crackers"
          description="Thank you for sharing your review with V Crackers."
          noindex
        />
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div
            className="max-w-md w-full text-center p-8 rounded-2xl animate-fade-in-up"
            style={{
              background: "linear-gradient(135deg, #1a1726 0%, #0f0d1a 100%)",
              border: "1px solid rgba(255,102,0,0.15)",
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(76,175,80,0.15)" }}
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-white mb-3">
              Thank You! 🎉
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your review has been submitted and is awaiting approval. We truly
              appreciate your feedback!
            </p>

            {settings.googleReviewUrl && (
              <div className="mb-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500/20">
                <p className="text-sm text-blue-300 mb-3">
                  Would you also like to review us on Google?
                </p>
                <a
                  href={settings.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Rate us on Google
                </a>
              </div>
            )}

            <button
              onClick={() => navigate("/")}
              className="btn-fire px-6 py-3 rounded-xl text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const isUpdate = !!existingReview;

  return (
    <>
      <SEO
        title="Share Your Review | V Crackers"
        description="Tell us about your experience with V Crackers. Your feedback helps us serve you better."
        noindex
      />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div
          className="max-w-lg w-full p-6 sm:p-8 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #1a1726 0%, #0f0d1a 100%)",
            border: "1px solid rgba(255,102,0,0.12)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(140deg, rgba(139,0,0,0.3), rgba(255,102,0,0.3))",
              }}
            >
              {isUpdate ? (
                <Edit3 className="w-7 h-7 text-primary" />
              ) : (
                <Star className="w-7 h-7 text-primary" />
              )}
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-2">
              {isUpdate ? "Update Your Review" : "Share Your Experience"}
            </h1>
            <p className="text-gray-400 text-sm">
              {isUpdate
                ? "Your previous review is shown below. Make changes and submit to update."
                : "How was your experience with V Crackers?"}
            </p>
            {isUpdate && existingReview.status === "pending" && (
              <p className="text-yellow-400/80 text-xs mt-2">
                ⏳ Your review is awaiting approval
              </p>
            )}
            {isUpdate && existingReview.status === "approved" && (
              <p className="text-green-400/80 text-xs mt-2">
                ✅ Your review is live on the website
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Your Rating
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-400 mt-2 animate-fade-in-up">
                  {rating === 5
                    ? "Excellent! ⭐"
                    : rating === 4
                    ? "Great! 👍"
                    : rating === 3
                    ? "Good 👌"
                    : rating === 2
                    ? "Fair"
                    : "We'll do better 🙏"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                maxLength={500}
                className="w-full bg-gray-900/80 text-white rounded-xl border border-gray-700/50 px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-600 mt-1 text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !rating}
              className="btn-fire w-full py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  {isUpdate ? "Update Review" : "Submit Review"}{" "}
                  <Send className="inline-block ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Review CTA */}
          {settings.googleReviewUrl && (
            <div className="mt-6 pt-6 border-t border-gray-800/50 text-center">
              <p className="text-xs text-gray-500 mb-3">
                You can also review us on Google
              </p>
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Rate us on Google
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReviewPage;
