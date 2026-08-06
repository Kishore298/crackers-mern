import React from "react";

export default function PhonePeIcon({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 60 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="20" rx="4" fill="#5f259f" />
      <text x="30" y="14" fill="white" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="10" fontWeight="bold" letterSpacing="0.5" textAnchor="middle">PhonePe</text>
    </svg>
  );
}
