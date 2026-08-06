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
      {/* Main Lens Circle */}
      <circle cx="11.5" cy="11.5" r="6.8" strokeWidth={strokeWidth} />
      
      {/* Top-Left Inner Lens Reflection Glint Arc */}
      <path d="M 8.2 8.2 A 4.8 4.8 0 0 1 11.5 6.2" strokeWidth={strokeWidth * 0.85} />
      <circle cx="7.5" cy="11.5" r="0.4" fill="currentColor" stroke="none" />

      {/* Diagonal Handle to Bottom Right */}
      <path d="m 16.5 16.5 4.5 4.5" strokeWidth={strokeWidth * 1.25} />
    </svg>
  );
}
