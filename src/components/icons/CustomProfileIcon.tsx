"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomProfileIcon({
  size = 22,
  strokeWidth = 2,
  active = false,
  className,
  ...props
}: IconProps) {
  if (active) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        {...props}
      >
        {/* Head */}
        <circle cx="12" cy="7.5" r="3.5" />
        {/* Shoulder Base */}
        <path d="M5.2 19.5c.6-3.6 3.4-5.5 6.8-5.5s6.2 1.9 6.8 5.5c-1.8.8-4.2 1.3-6.8 1.3s-5-.5-6.8-1.3Z" />
      </svg>
    );
  }

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
      {/* Clean Head Circle */}
      <circle cx="12" cy="7.5" r="3.4" strokeWidth={strokeWidth} />
      
      {/* Smooth Curved Shoulder Arc */}
      <path
        d="M5.5 19.5c.6-3.2 3.2-5.5 6.5-5.5s5.9 2.3 6.5 5.5"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
