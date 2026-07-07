import React from "react";
import SEO from "../components/SEO";

const ShippingPolicyPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Shipping Policy" description="Shipping and Delivery Policy for V Crackers." />
      
      <div className="py-10 md:py-16" style={{ background: "#13111f", borderBottom: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            Shipping & Delivery Policy
          </h1>
          <p className="text-gray-400">Information on how we get your festive items delivered safely.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-300 leading-relaxed">
        <section>
          <p>
            Due to the nature of our products, standard courier services (like DTDC, BlueDart, Postal Service) cannot be used for delivery. All products are dispatched strictly through registered <strong>Lorry Transport Services (Parcel Services)</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">1. Dispatch Process</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All confirmed orders are processed and packed within 2-3 business days.</li>
            <li>Once packed, the parcel is dropped at the nearest partnered Lorry Shed in Sivakasi.</li>
            <li>We will inform you via email, SMS, or WhatsApp with the Logistics LR Copy (Lorry Receipt) or a tracking number once dispatched.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">2. Collection from Destination</h2>
          <p className="mb-2">Because door-delivery is rarely supported, <strong>customers must collect their parcels from the corresponding transport office branch in their city.</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>When the parcel arrives at your city, the transport agency will usually call your registered mobile number.</li>
            <li>You will need to present an ID proof and the pending transport freight charges (if not pre-paid) to collect the boxes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">3. Delivery Timelines</h2>
          <p>
            Delivery speed depends heavily on your geographic location relative to Sivakasi, Tamil Nadu.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Tamil Nadu:</strong> Usually 2-4 Days</li>
            <li><strong>South India (Karnataka, Kerala, AP, Telangana):</strong> Usually 4-6 Days</li>
            <li><strong>Other States:</strong> Usually 7-12 Days</li>
          </ul>
          <p className="text-sm mt-3 text-red-600">Note: During the peak Diwali season, timelines may be extended due to a heavy rush at transport hubs.</p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">4. Shipping Charges</h2>
          <p>
            Unless explicitly mentioned as "Free Shipping" during checkout, transport freight charges (Ledge charges, loading/unloading, and transport fee) are usually paid by the customer either directly during checkout, or as a "To-Pay" amount given directly to the transporter at the time of parcel collection.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
