"use client";

import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

export function CustomHomeIcon({
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
      {/* Roof with Chimney */}
      <path d="M12 2.5 1.5 11a1.5 1.5 0 0 0 1.9 2.3L12 5.5l8.6 7.8a1.5 1.5 0 0 0 1.9-2.3L12 2.5Z" />
      <path d="M17.5 4.5v3.5l2 1.8V4.5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1Z" />
      {/* Home Body */}
      <path d="M4.5 11.5V20a2 2 0 0 0 2 2h4v-5a1.5 1.5 0 0 1 3 0v5h4a2 2 0 0 0 2-2v-8.5l-7.5-6.8-7.5 6.8Z" />
    </svg>
  );
}
