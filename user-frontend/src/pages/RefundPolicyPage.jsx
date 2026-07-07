import React from "react";
import SEO from "../components/SEO";

const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Refund & Cancellation Policy" description="Refund and cancellation rules for V Crackers festive products." />
      
      <div className="py-10 md:py-16" style={{ background: "#13111f", borderBottom: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-gray-400">Please review our rules regarding order cancellations.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-300 leading-relaxed">
        <section>
          <p className="font-semibold text-red-600">
            Due to the regulated nature of our festive products, all sales are considered final once the parcel is handed over to the transport agency.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">1. Order Cancellations</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Before Dispatch:</strong> You can cancel your order and receive a full refund if the order has not yet been dispatched from our Sivakasi warehouse. Please contact us immediately at +91 78249 07916 to request a cancellation.</li>
            <li><strong>After Dispatch:</strong> Once your parcel is shipped and the Lorry Receipt (LR copy) is generated, we cannot process any cancellations.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">2. Damaged or Defective Items</h2>
          <p>
            We take extreme care in packing our items using thick corrugated boxes. However, if you receive a product that is visibly damaged due to transport mishandling, please take a photograph or video immediately upon opening the box and share it on our WhatsApp number. Claims must be made within 24 hours of collecting the parcel. Approvals for partial refunds or replacements are at the sole discretion of V Crackers management.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">3. Refund Process</h2>
          <p>
            Approved refunds for pre-paid, cancelled orders will be processed back to the original mode of payment (Netbanking, UPI, Credit/Debit card). Depending on the bank aggregator, the credited amount will reflect in your account within 5-7 business days.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">4. Returns</h2>
          <p>
            Combustible items cannot be returned through regular courier services due to strict Indian Logistics regulations. Therefore, <strong>we do not accept physical returns of products once collected by the customer.</strong>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
