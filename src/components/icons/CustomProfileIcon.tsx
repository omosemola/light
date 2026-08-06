"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomProfileIcon({
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
      {/* Outer Head Circle */}
      <circle cx="12" cy="8" r="5" strokeWidth={strokeWidth} />
      
      {/* Inner Head Reflection Glint Arc */}
      <path d="M 9.2 5.5 A 3.2 3.2 0 0 1 11.6 4.3" strokeWidth={strokeWidth * 0.85} />
      <circle cx="9" cy="9" r="0.4" fill="currentColor" stroke="none" />

      {/* Smooth Curved Shoulder Base */}
      <path d="M 4 20.5 C 4 15.8, 7.5 13.8, 12 13.8 C 16.5 13.8, 20 15.8, 20 20.5" strokeWidth={strokeWidth} />
    </svg>
  );
}
