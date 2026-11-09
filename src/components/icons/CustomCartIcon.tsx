"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomCartIcon({
  size = 22,
  strokeWidth = 2,
  active = false,
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
      strokeWidth={active ? 2.3 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Sleek rounded shopping cart */}
      <path d="M3 3.5h2.4l2.2 9.4a1.6 1.6 0 0 0 1.6 1.1h9.2a1.6 1.6 0 0 0 1.6-1.1l1.5-6.4H6.2" />
      {/* Wheels */}
      <circle cx="9.5" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
