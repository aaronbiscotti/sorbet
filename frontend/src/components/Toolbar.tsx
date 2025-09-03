"use client";

import React, { useState } from "react";
import {
  CursorArrowRaysIcon,
  PencilIcon,
  RectangleGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type Tool = "cursor" | "pencil" | "select";

type ToolbarProps = {
  activeTool: Tool;
  onChange: (tool: Tool) => void;
  brushWidth?: number;
  onBrushWidthChange?: (width: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function Toolbar({
  activeTool,
  onChange,
  brushWidth = 2,
  onBrushWidthChange,
  className,
  style,
}: ToolbarProps) {
  const [showBrushPopover, setShowBrushPopover] = useState(false);

  const baseBtn = "p-2.5 rounded-md transition-all duration-200";
  const activeBtn =
    "bg-gradient-to-r from-[#3185fe] to-[#1651f3] text-white shadow-lg";
  const inactiveBtn = "hover:bg-white/10 text-[#a1a1a1] hover:text-white";

  return (
    <div
      className={`relative flex flex-col gap-2 bg-[#1a1a1a] p-2 rounded-lg shadow-xl border border-[#2a2a2a] ${
        className ?? ""
      }`}
      style={style}
    >
      <button
        onClick={() => onChange("cursor")}
        className={`${baseBtn} ${
          activeTool === "cursor" ? activeBtn : inactiveBtn
        }`}
        title="Cursor Tool"
      >
        <CursorArrowRaysIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => {
          if (activeTool === "pencil") {
            setShowBrushPopover((v) => !v);
          } else {
            onChange("pencil");
            setShowBrushPopover(false);
          }
        }}
        className={`${baseBtn} ${
          activeTool === "pencil" ? activeBtn : inactiveBtn
        }`}
        title="Pencil Tool"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => onChange("select")}
        className={`${baseBtn} ${
          activeTool === "select" ? activeBtn : inactiveBtn
        }`}
        title="Selection Tool"
      >
        <RectangleGroupIcon className="h-5 w-5" />
      </button>
      {showBrushPopover && (
        <div
          className="absolute left-full ml-3 top-8 z-40 w-56 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] shadow-2xl origin-left overflow-hidden"
          style={{
            animation:
              "popover-bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          <div className="bg-gradient-to-r from-[#3185fe]/10 to-[#1651f3]/10 px-4 py-3 border-b border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Brush Settings
              </span>
              <button
                onClick={() => setShowBrushPopover(false)}
                className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-[#6a6a6a] hover:text-white transition-all"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#6a6a6a] font-medium">
                  Brush Width
                </span>
                <span className="text-sm font-mono text-white bg-[#1a1a1a] px-2 py-1 rounded">
                  {brushWidth}px
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={brushWidth}
                  onChange={(e) => onBrushWidthChange?.(Number(e.target.value))}
                  className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[#4a4a4a]">1px</span>
                  <span className="text-[10px] text-[#4a4a4a]">24px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
