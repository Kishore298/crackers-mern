import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaInstagram, FaYoutube, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const PremiumExtras = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showSocialSidebar, setShowSocialSidebar] = useState(true);
  const [hasAutoClosed, setHasAutoClosed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0;

      setScrollProgress(scroll);
      setShowBackToTop(totalScroll > 300);

      // Auto close social on mobile when scrolled 1 screen down
      if (totalScroll > document.documentElement.clientHeight && !hasAutoClosed) {
        setShowSocialSidebar(false);
        setHasAutoClosed(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasAutoClosed]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-transparent">
        <div
          className="h-full bg-primary shadow-[0_0_10px_#ff6600]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Social Icons (Left) */}
      <div className="fixed bottom-6 left-0 z-[90] flex items-end">
        {/* Mobile Toggle Button (Visible when closed) */}
        <button
          onClick={() => setShowSocialSidebar(true)}
          className={`md:hidden absolute left-0 bottom-4 p-2 bg-surface-2/90 backdrop-blur border border-l-0 border-white/10 rounded-r-xl text-primary shadow-lg transition-transform duration-300 z-0 ${showSocialSidebar ? '-translate-x-full' : 'translate-x-0'}`}
          aria-label="Open social links"
          style={{ background: "#13111f" }}
        >
          <FaChevronRight className="text-xs" />
        </button>

        {/* Social Icons Container */}
        <div className={`flex flex-col gap-2 md:gap-4 p-2 md:p-0 md:left-6 md:relative md:translate-x-0 transition-transform duration-300 z-10 ${showSocialSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Close button for mobile */}
          <button
            onClick={() => setShowSocialSidebar(false)}
            className="md:hidden p-2 mx-auto rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors mb-1"
            aria-label="Close social links"
          >
            <FaChevronLeft className="text-sm" />
          </button>

          <a href="https://www.instagram.com/leo_crackers_sivakasi?igsh=eDBwcG5jcXd5c3Rs&utm_source=qr" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-[0_0_15px_rgba(220,39,67,0.4)] hover:shadow-[0_0_20px_rgba(220,39,67,0.7)] transition-all duration-300 hover:scale-110 flex items-center justify-center" aria-label="Instagram">
            <FaInstagram className="text-xl md:text-2xl" />
          </a>
          <a href="https://youtube.com/@leocrackers-sivakasi?si=mQ6IhVeWEWq8pQEN" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-[#FF0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,0,0,0.7)] transition-all duration-300 hover:scale-110 flex items-center justify-center" aria-label="YouTube">
            <FaYoutube className="text-xl md:text-2xl" />
          </a>
        </div>
      </div>

      {/* Floating Buttons Container (Right) */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-3 md:gap-4 items-center">
        {/* Back to Top */}
        <button
          onClick={scrollToTop}
          className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 shadow-lg ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
          aria-label="Back to top"
          style={{ background: "#13111f", border: "1px solid #ff6600", color: "#ff6600" }}
        >
          <FaArrowUp />
        </button>

        {/* Existing WhatsApp Button from App.js */}
        <div className="relative flex items-center justify-center">
          {/* Ping effect behind the button */}
          <div className="absolute w-12 h-12 bg-[#25D366] rounded-full animate-ping opacity-60"></div>

          <a
            href="https://wa.me/918778468360"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
            style={{ width: "48px", height: "48px" }}
            aria-label="Chat on WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ width: "28px", height: "28px" }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297C18.22 1.24 15.228 0 12.046 0 5.426 0 .041 5.385.039 12.005c0 2.118.552 4.186 1.602 6.002L0 24l6.14-1.61c1.748.956 3.722 1.459 5.733 1.46h.005c6.619 0 12.004-5.384 12.006-12.004a11.97 11.97 0 00-3.52-8.459" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
};

export default PremiumExtras;
