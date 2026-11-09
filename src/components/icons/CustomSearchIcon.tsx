"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomSearchIcon({
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
      {/* Search Lens */}
      <circle cx="11" cy="11" r="6.2" />
      {/* Handle */}
      <path d="m15.5 15.5 4.5 4.5" strokeWidth={active ? 2.5 : strokeWidth * 1.15} />
    </svg>
  );
}
