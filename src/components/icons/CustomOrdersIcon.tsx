"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomOrdersIcon({
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
      {/* Outer rounded clipboard body */}
      <rect x="3.5" y="3.5" width="17" height="18" rx="4" />
      {/* Top Clip Arch */}
      <path d="M8.5 4.5a3.5 3.5 0 0 1 7 0" strokeWidth={strokeWidth * 1.1} />
      
      {/* First Row Checkmark & Line */}
      <path d="m7.5 10.5 1.5 1.5 3-3" strokeWidth={strokeWidth * 1.1} />
      <path d="M14.5 10.5h3" strokeWidth={strokeWidth * 1.1} />

      {/* Second Row Checkmark & Line */}
      <path d="m7.5 16 1.5 1.5 3-3" strokeWidth={strokeWidth * 1.1} />
      <path d="M14.5 16h3" strokeWidth={strokeWidth * 1.1} />
    </svg>
  );
}
