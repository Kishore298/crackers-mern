import React from "react";
import SEO from "../components/SEO";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Privacy Policy" description="Privacy Policy for V Crackers." />
      
      <div className="py-10 md:py-16" style={{ background: "#13111f", borderBottom: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-300 leading-relaxed">
        <section>
          <p>
            V Crackers ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by V Crackers when you use our website (vcrackers.com).
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">1. Information We Collect</h2>
          <p className="mb-2">We collect information that you directly provide to us, such as:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Data:</strong> Name, phone number, email address, password, and WhatsApp number when you register for an account or place an order.</li>
            <li><strong>Shipping Data:</strong> Delivery addresses, pin codes, and recipient names.</li>
            <li><strong>Order Data:</strong> Details about the products you have ordered from us.</li>
          </ul>
          <p className="mt-4">Please note that we do not store debit/credit card or net banking details. Payments are securely processed via certified third-party payment gateways (e.g., Razorpay).</p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process your orders, arrange shipping, and provide invoices/receipts.</li>
            <li>To communicate with you regarding your order status via SMS, Email, or WhatsApp.</li>
            <li>To provide customer support and troubleshoot order issues.</li>
            <li>To send you promotional offers and updates (only if you have opted in).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">3. WhatsApp Communication</h2>
          <p>
            By sharing your phone number with us, you consent to receive transactional notifications (such as OTP authentications, order confirmations, status updates, and payment links) via WhatsApp. You can opt out of promotional messages at any time.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">4. Sharing Your Information</h2>
          <p>
            We only share your information with trusted third parties to facilitate our services, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Delivery Partners:</strong> Forwarding your name, number, and address to our assigned transport services for seamless delivery.</li>
            <li><strong>Payment Processors:</strong> To facilitate secure online transactions.</li>
          </ul>
          <p className="mt-4">We do not sell, trade, or rent your personal identification information to others.</p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">5. Data Security</h2>
          <p>
            We implement industry-standard data collection, storage, and processing practices, including security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-2xl text-white mb-4">6. Contacting Us</h2>
          <p>
            If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at: <br/><br/>
            <strong>V Crackers</strong> <br/>
            Email: vcrackerssivakasi@gmail.com <br/>
            Phone: +91 78249 07916
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
