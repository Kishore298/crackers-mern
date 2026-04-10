import React from "react";
import SEO from "../components/SEO";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO title="Terms & Conditions" description="Terms and Conditions of using V Crackers services." />
      
      <div className="bg-surface border-b border-orange-100 py-10 md:py-16">
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-gray-900 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-600">Please read these terms carefully before using our website.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and placing an order with V Crackers, you confirm that you are in agreement with and bound by the terms and conditions outlined below. These terms apply to the entire website and any email, WhatsApp, or other type of communication between you and V Crackers.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">2. Legal Age Requirement</h2>
          <p>
            You must be at least 18 years of age to purchase fireworks from our website. By placing an order, you certify that you are legally permitted to purchase, receive, and possess fireworks in your respective city and state.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">3. Products and Pricing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All prices are listed in Indian Rupees (INR) and are subject to change without prior notice.</li>
            <li>We strive to display our products as accurately as possible; however, packaging, wrapper designs, and sizes may occasionally vary from the images shown.</li>
            <li>All items are subject to availability. If a purchased item is out of stock, we reserve the right to either refund the amount or substitute it with an item of equal or greater value after obtaining your consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">4. Payment Terms</h2>
          <p>
            We offer 100% secure payment options. Orders will only be processed upon successful verification of payment (for prepaid orders). In the case of Cash on Delivery (COD), standard conditions and limits defined during checkout will apply.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">5. Transport and Liability</h2>
          <p>
            Fireworks are strictly regulated goods. We dispatch materials through licensed, third-party logistics/transport agencies (Lorry Sheds). Once the consignment is handed over to the transport agency, V Crackers is not directly liable for transport delays or damages, though we will assist in resolving any issues with the transporter to the best of our ability.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">6. Jurisdiction</h2>
          <p>
            Any disputes arising out of these terms and conditions shall be subject to the exclusive jurisdiction of the courts in Sivakasi, Tamil Nadu.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
