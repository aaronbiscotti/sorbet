"use client";

import React from "react";
import Image from "next/image";

type ResultPanelProps = {
  image: string | null;
};

export function ResultPanel({ image }: ResultPanelProps) {
  if (!image) return null;
  return (
    <div className="gradient-border">
      <div className="rounded-xl bg-[--color-background] p-4 relative z-10">
        <h3 className="mb-2 text-center text-lg font-medium">Result</h3>
        <Image
          src={image}
          alt="Generated image"
          width={512}
          height={512}
          className="rounded-lg w-full h-auto"
        />
      </div>
    </div>
  );
}
