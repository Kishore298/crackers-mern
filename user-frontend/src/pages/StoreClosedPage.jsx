import React from "react";
import { AlertCircle, Phone } from "lucide-react";
import { Helmet } from "react-helmet-async";

const StoreClosedPage = () => {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Store Closed - V Crackers</title>
      </Helmet>

      <div className="max-w-md w-full bg-dark-card border border-primary/20 rounded-2xl shadow-xl overflow-hidden text-center relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-400 to-primary"></div>

        <div className="p-8 sm:p-10">
          <img
            src="/v-crackers-logo.png"
            alt="V Crackers Logo"
            className="w-32 h-auto mx-auto mb-8 drop-shadow-md"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/150x50?text=V+Crackers";
            }}
          />

          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Online Orders Closed
          </h1>

          <p className="text-gray-300 text-sm sm:text-base mb-8 leading-relaxed">
            We are currently not accepting online orders. But don't worry! You can still place your orders by contacting us directly.
          </p>

          <div className="space-y-4">
            <a
              href="tel:+918838696953"
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-primary hover:bg-orange-600 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-primary hover:-translate-y-0.5"
            >
              <Phone className="w-5 h-5" />
              Call us to Order
            </a>

            <a
              href="https://wa.me/918838696953"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Us
            </a>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800 text-gray-400 text-sm">
            <h3 className="font-semibold text-white mb-2">Visit Our Store</h3>
            <p className="leading-relaxed">
              V Crackers, 4/468-G,<br/>
              Sithalakshmi Nagar,<br/>
              Kongalapuram, Sivakasi - 626123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreClosedPage;
