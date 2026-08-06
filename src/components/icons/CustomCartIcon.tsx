"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomCartIcon({
  size = 22,
  strokeWidth = 2,
  className,
  ...props
}: IconProps) {
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
      {/* Handle & Angled Open Cart Basket */}
      <path d="M 2.5 3.5 h 2.8 l 2.4 10 a 1.8 1.8 0 0 0 1.6 1.2 h 9.2 a 1.8 1.8 0 0 0 1.6 -1.2 l 1.8 -6.5 a 1 1 0 0 0 -0.9 -1.3 H 7.2" strokeWidth={strokeWidth} />
      
      {/* Inner Top-Right Accent Line */}
      <path d="M 17.5 7.8 v 2 a 1 1 0 0 1 -1 1" strokeWidth={strokeWidth * 0.85} />
      <circle cx="17.5" cy="12" r="0.4" fill="currentColor" stroke="none" />

      {/* Solid Circular Wheels */}
      <circle cx="9.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
