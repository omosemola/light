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
      {/* Top Tote Handle */}
      <path d="M8 7a4 4 0 0 1 8 0" strokeWidth={strokeWidth * 1.1} />
      
      {/* Tote Bag Body */}
      <path d="M4.5 7.5h15a1 1 0 0 1 1 1.1l-1.5 11a3.5 3.5 0 0 1-3.5 3h-7a3.5 3.5 0 0 1-3.5-3l-1.5-11a1 1 0 0 1 1-1.1Z" strokeWidth={strokeWidth * 1.1} />

      {/* Center Checkmark */}
      <path d="m9.5 14.5 2 2 3.5-3.5" strokeWidth={strokeWidth * 1.2} />
    </svg>
  );
}
