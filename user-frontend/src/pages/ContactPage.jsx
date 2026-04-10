import React from "react";
import SEO from "../components/SEO";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO title="Contact Us" description="Get in touch with V Crackers for any inquiries, bulk orders, or support." />
      
      <div className="bg-surface border-b border-orange-100 py-10 md:py-16">
        <div className="w-full md:max-w-[80%] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-black text-3xl md:text-5xl text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600">We'd love to hear from you! Reach out for bulk orders or any support.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[80%] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="font-heading font-bold text-2xl text-gray-900">Get In Touch</h2>
            <p className="text-gray-600 leading-relaxed">
              Whether you have a question about our products, need assistance with your order, or want to place a bulk inquiry, our team is always ready to assist you.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Our Address</h3>
                  <p className="text-gray-600 leading-relaxed">
                    V Crackers <br/>
                    4/468-G, Sithalakshmi Nagar, <br/>
                    Kongalapuram, Sivakasi - 626123 <br/>
                    Tamil Nadu, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Phone Numbers</h3>
                  <a href="tel:+917824907916" className="text-gray-600 hover:text-primary block">+91 78249 07916</a>
                  <a href="tel:+918838696953" className="text-gray-600 hover:text-primary block">+91 88386 96953</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:vcrackerssivakasi@gmail.com" className="text-gray-600 hover:text-primary">vcrackerssivakasi@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Business Hours</h3>
                  <p className="text-gray-600">Monday - Saturday: 9:00 AM - 8:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed (Except during Diwali season)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (UI Only) */}
          <div className="bg-surface border border-orange-100 rounded-2xl p-6 md:p-8">
            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input type="tel" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="Your Phone Number" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="Your Email" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea rows="4" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="btn-fire w-full justify-center py-3">Submit Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
