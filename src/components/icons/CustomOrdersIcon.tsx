"use client";

import React from "react";
import { IconProps } from "./CustomHomeIcon";

export function CustomOrdersIcon({
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
      {/* Rounded Receipt / Order Document */}
      <rect x="4.5" y="3" width="15" height="18" rx="3" />
      {/* Content lines */}
      <path d="M8.5 7.5h7" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 15.5h4.5" />
    </svg>
  );
}
