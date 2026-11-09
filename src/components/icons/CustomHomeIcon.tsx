"use client";

import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  active?: boolean;
}

export function CustomHomeIcon({
  size = 22,
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
        {/* Exact OPay Solid Home with Smile Cutout */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.6c-.6 0-1.15.28-1.55.75L3.9 10.3c-.55.65-.9 1.45-.9 2.3v6c0 1.5 1.2 2.7 2.7 2.7h12.6c1.5 0 2.7-1.2 2.7-2.7v-6c0-.85-.35-1.65-.9-2.3L13.55 3.35C13.15 2.88 12.6 2.6 12 2.6Zm-3.2 12.6c.3 1.15 1.6 1.9 3.2 1.9s2.9-.75 3.2-1.9a.85.85 0 0 0-1.65-.45c-.15.5-.75.95-1.55.95s-1.4-.45-1.55-.95a.85.85 0 0 0-1.65.45Z"
        />
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 11 11 4.5c.55-.55 1.45-.55 2 0L19.5 11c.3.3.5.7.5 1.2v6.1c0 1.2-1 2.2-2.2 2.2H6.2c-1.2 0-2.2-1-2.2-2.2v-6.1c0-.5.2-.9.5-1.2Z" />
      <path d="M9.5 15.2c.65.9 1.5 1.3 2.5 1.3s1.85-.4 2.5-1.3" />
    </svg>
  );
}
