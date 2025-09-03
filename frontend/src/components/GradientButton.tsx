"use client";

import React from "react";

type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function GradientButton({
  children,
  className,
  ...props
}: GradientButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 w-full items-center justify-center rounded-md bg-gradient-to-r from-[#3185fe] via-[#1651f3] to-[#3185fe] px-4 py-2.5 font-medium text-white border-0 transition-all duration-200 transform-gpu hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(49,133,254,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
