import React from "react";
import SEO from "../components/SEO";

const AboutPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="About V Crackers – Sivakasi Crackers & Fireworks" description="Learn about V Crackers, a Sivakasi-based crackers and fireworks store serving customers across India with quality products and reliable delivery." canonical="https://vcrackers.in/about" />

      {/* Header */}
      <div className="py-10 md:py-16" style={{ background: "#13111f", borderBottom: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            About V Crackers
          </h1>
          <p className="text-gray-400">Sivakasi's crackers and fireworks store, bringing light to your celebrations.</p>
          <p className="text-gray-400">Your trusted online store for high-quality Sivakasi crackers and fireworks.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-300 leading-relaxed">
        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Our Heritage</h2>
          <p>
            Welcome to V Crackers, your trusted source for crackers and fireworks from Sivakasi. Based in Sivakasi, Tamil Nadu — the hub of India's fireworks industry — we offer a wide range of crackers, sparklers, rockets, flower pots, fancy fireworks, and combo packs. What began as a passionate endeavor has grown into a reliable online crackers store, serving customers across India. We take pride in offering quality products that add a real spark to your celebrations.
          </p>
        </section>

        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Uncompromising Quality</h2>
          <p>
            At V Crackers, product quality is our core principle. Every cracker, sparkler, and fireworks item we stock is selected to meet safety and performance standards. We ensure our crackers are sourced from trusted manufacturers in Sivakasi and dispatched with proper packaging to reach you safely. When you order from V Crackers, you get dependable quality without compromise.
          </p>
        </section>

        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Our Vision</h2>
          <p>
            Our goal is to make every Diwali, wedding, and celebration a memorable one for families across India. We ship crackers and fireworks to all states. Our online store makes it simple to browse, order, and receive your fireworks — right at your doorstep, or collected from your nearest transport hub. Thank you for choosing V Crackers.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
