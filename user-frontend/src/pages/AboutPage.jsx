import React from "react";
import SEO from "../components/SEO";

const AboutPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="About Us" description="Learn more about V Crackers, Sivakasi's premier destination for high-quality festive products." />
      
      {/* Header */}
      <div className="py-10 md:py-16" style={{ background: "#13111f", borderBottom: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            About V Crackers
          </h1>
          <p className="text-gray-400">Bringing light to your celebrations from the heart of Sivakasi.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-300 leading-relaxed">
        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Our Heritage</h2>
          <p>
            Welcome to V Crackers, your trusted partner in illuminating celebrations across India! Nestled in Sivakasi, the hub of the nation, we boast years of tradition and excellence in providing high-quality festive products. What began as a passionate endeavor has now evolved into one of the most reliable and beloved festive brands. We take immense pride in crafting products that add an extra spark of joy to your special occasions.
          </p>
        </section>

        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Uncompromising Quality</h2>
          <p>
            At V Crackers, quality is not just a promise; it's our core principle. Every product that leaves our facility undergoes rigorous testing to ensure it meets superior safety and performance standards. We source premium raw materials and employ skilled artisans who ensure every product performs with unmatched brilliance. When you choose V Crackers, you choose unmatched brilliance without compromising on safety.
          </p>
        </section>

        <section className="p-8 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">Our Vision</h2>
          <p>
            Our vision is to make every festival, wedding, and celebration a memorable spectacle. We aim to reach every doorstep in India with our seamless online ordering and robust delivery network, ensuring that the magic of Sivakasi celebration packs can be enjoyed by everyone, everywhere. Thank you for choosing V Crackers to be a part of your happiness.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
