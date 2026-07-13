import React, { useEffect, useState } from "react";
import api from "../services/api";
import ComboCard from "../components/ComboCard";
import SEO from "../components/SEO";

const CombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("all");
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    const fetchCombos = async () => {
      setLoading(true);
      try {
        // Fetch all products marked as combo
        const { data } = await api.get(`/products?isCombo=true&limit=100`);
        setCombos(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchDiscount = async () => {
      try {
        const { data } = await api.get("/discount");
        if (data.discount?.isActive) setDiscountPct(data.discount.percentage);
      } catch (err) {
        // ignore
      }
    };

    fetchCombos();
    fetchDiscount();
  }, []);

  const displayedCombos =
    activeTag === "all"
      ? combos
      : combos.filter((c) => c._id === activeTag);

  return (
    <div className="min-h-screen animate-fade-in-up pb-20" style={{ background: "#0a0814" }}>
      <SEO
        title="Stunning Combos - Premium Fireworks Packages"
        description="Browse our specially curated Stunning Combos for the ultimate festive celebration. High quality fireworks from Sivakasi at discounted prices."
      />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 pt-10">
        <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
          Stunning Combos 🎇
        </h1>
        <p className="text-gray-400 mb-8 max-w-2xl text-sm sm:text-base leading-relaxed">
          Take the guesswork out of your celebrations with our expertly curated
          combos. Each pack is designed to give you the perfect balance of ground
          crackers, aerial shots, and beautiful fountains.
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-dark-card-2 border-t-primary animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-surface rounded-2xl border border-white/5">
            <p>No combos available at the moment. Please check back later!</p>
          </div>
        ) : (
          <>
            {/* Tag Buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => setActiveTag("all")}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeTag === "all"
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
                style={
                  activeTag === "all"
                    ? { background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,102,0,0.1)" }
                }
              >
                All Combos
              </button>
              {combos.map((combo) => (
                <button
                  key={combo._id}
                  onClick={() => setActiveTag(combo._id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeTag === combo._id
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                  style={
                    activeTag === combo._id
                      ? { background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,102,0,0.1)" }
                  }
                >
                  {combo.name}
                </button>
              ))}
            </div>

            {/* Grid of ComboCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedCombos.map((combo) => (
                <ComboCard key={combo._id} combo={combo} discountPct={discountPct} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CombosPage;
