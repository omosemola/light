"use client";

import React from "react";

export interface CustomSearchIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

export function CustomSearchIcon({
  size = 22,
  strokeWidth = 2,
  className,
  ...props
}: CustomSearchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top Search Bar Capsule */}
      <rect x="2" y="2.5" width="20" height="7.5" rx="3.75" />
      {/* Miniature magnifying glass inside search bar top-right */}
      <circle cx="18" cy="6" r="1.2" />
      <path d="m19 7 1.2 1.2" />

      {/* Main Front Magnifying Glass Lens */}
      <circle cx="12" cy="13.5" r="5" />
      
      {/* Inner Lens Reflection Glint */}
      <path d="M12 10.5a3 3 0 0 1 2.5 1.5" opacity="0.6" />

      {/* Magnifying Glass Straight Rounded Handle */}
      <path d="M12 18.5v4" strokeWidth={strokeWidth * 1.3} />
    </svg>
  );
}
