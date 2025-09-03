"use client";

import React from "react";

type BrushOverlayProps = {
  visible: boolean;
  brushColor: string;
  brushWidth: number;
  onBrushColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  onClose: () => void;
  /** Left offset in pixels to place the overlay just to the right of the sidebar */
  leftOffsetPx?: number;
};

export function BrushOverlay({
  visible,
  brushColor,
  brushWidth,
  onBrushColorChange,
  onBrushWidthChange,
  onClose,
  leftOffsetPx = 72,
}: BrushOverlayProps) {
  if (!visible) return null;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 z-20"
      style={{ left: leftOffsetPx }}
    >
      <div className="rounded-md border border-[--color-border] bg-[#1f1f1f] p-4 shadow-xl w-60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[--color-foreground]">
            Brush settings
          </h3>
          <button
            className="h-6 w-6 rounded hover:bg-white/5 flex items-center justify-center"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3 text-[--color-foreground]">
          <label className="text-sm">Color</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => onBrushColorChange(e.target.value)}
            className="h-9 w-full rounded-md bg-[#2a2a2a] border border-[#3a3a3a]"
          />
          <label className="text-sm">Width: {brushWidth}px</label>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={brushWidth}
            onChange={(e) => onBrushWidthChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
