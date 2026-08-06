import React from "react";

export default function PaytmIcon({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 60 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="20" rx="4" fill="#002970" />
      <text x="30" y="14" fill="#00baf2" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="11" fontStyle="italic" fontWeight="900" letterSpacing="0.5" textAnchor="middle">Paytm</text>
    </svg>
  );
}
