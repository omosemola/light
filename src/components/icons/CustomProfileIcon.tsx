"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomProfileIcon({
  size = 22,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      {/* Circular Head */}
      <circle cx="9.5" cy="6.5" r="4.5" />
      
      {/* 3 Upper-right horizontal menu lines */}
      <rect x="16" y="2" width="6" height="2" rx="1" />
      <rect x="16" y="6" width="6" height="2" rx="1" />
      <rect x="18" y="10" width="4" height="2" rx="1" />

      {/* Rounded Torso / Shoulders */}
      <path d="M2.5 14c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4v5c0 1.7-1.3 3-3 3h-8c-1.7 0-3-1.3-3-3v-5Z" />
    </svg>
  );
}
