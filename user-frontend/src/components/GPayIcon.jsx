import React from "react";

export default function GPayIcon({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 42 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.6 7.2c0-.5-.1-.9-.2-1.3H7.5v2.5h4c-.2 1-.9 1.8-1.7 2.3v1.9h2.7c1.6-1.5 2.5-3.6 2.5-5.4z" fill="#4285F4"/>
      <path d="M7.5 14.5c2 0 3.7-.7 4.9-1.8l-2.7-1.9c-.7.4-1.5.7-2.3.7-1.7 0-3.2-1.2-3.7-2.8H1V11c1.2 2.5 3.8 4.1 6.8 4.1z" fill="#34A853"/>
      <path d="M3.7 9.3c-.1-.5-.2-1-.2-1.5 0-.5.1-1 .2-1.5V4H1C.3 5.1 0 6.4 0 7.8s.3 2.7 1 3.8l2.7-2.3z" fill="#FBBC04"/>
      <path d="M7.5 3.3c1 0 2 .4 2.8 1.1l2.1-2.1C11.1 1 9.4 0 7.5 0 4.5 0 1.9 1.6 1 4.2l2.7 2.3c.5-1.7 2.1-2.9 3.8-2.9z" fill="#EA4335"/>
      <text x="16.5" y="13.2" fill="white" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="13" fontWeight="500" letterSpacing="-0.3">Pay</text>
    </svg>
  );
}
