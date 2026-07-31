import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const NoticePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenNotice = sessionStorage.getItem("hasSeenNotice_v1");
    if (hasSeenNotice === "true") return;

    const hasSeenFireworks = sessionStorage.getItem("hasSeenFireworks_v12");

    if (hasSeenFireworks === "true") {
      setIsVisible(true);
      sessionStorage.setItem("hasSeenNotice_v1", "true");
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem("hasSeenNotice_v1", "true");
      }, 7500); // Wait 7.5 seconds for the fireworks to finish
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => setIsVisible(false);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closePopup}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4 sm:mt-2">
          <img
            src="/v-crackers-logo.webp"
            alt="Crackers Logo"
            className="h-16 mb-6 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div className="text-gray-800 text-sm sm:text-base leading-relaxed space-y-4 text-justify">
            <p>
              As per 2018 supreme court order, online sale of firecrackers are not permitted! We value our customers and at the same time, respect jurisdiction. We request you to add your products to the cart and submit the required crackers through the enquiry button. We will contact you within 24 hrs and confirm the order through WhatsApp or phone call.
            </p>
            <p>
              Please add and submit your enquiries and enjoy your Diwali celebrations. As a company following 100% legal & statutory compliances and all our shops, go-downs are maintained as per the explosive acts. We send the parcels through registered and legal transport service providers as like every other major companies in Sivakasi is doing so.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
