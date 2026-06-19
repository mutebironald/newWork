import React from "react";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="NewWork Logo"
    >
      <defs>
        <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="140" fill="url(#logo-bg-grad)" />
      <g fill="#ffffff">
        <path d="M 120 140 H 176 V 372 H 120 Z" />
        <path d="M 176 140 L 290 310 L 290 140 H 346 V 372 H 296 L 176 195 Z" />
        <path d="M 346 372 L 400 195 V 372 H 456 V 140 H 400 L 346 312 Z" />
      </g>
    </svg>
  );
}
