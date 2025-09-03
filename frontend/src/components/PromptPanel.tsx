"use client";

import React from "react";

type PromptPanelProps = {
  value: string;
  onChange: (v: string) => void;
  onPlus: () => void;
};

export function PromptPanel({ value, onChange, onPlus }: PromptPanelProps) {
  return (
    <div className="relative">
      <div className="rounded-xl border border-2 border-gray-700 bg-[--color-background] overflow-hidden">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask Gemini..."
          className="block w-full px-4 py-3 bg-transparent text-[--color-foreground] placeholder:text-[--color-muted] border-0 outline-none"
        />
        <div className="px-4 py-2 flex items-center">
          <button
            className="h-8 w-8 rounded-full bg-[#374151] flex items-center justify-center hover:bg-[#404a5c] transition-colors"
            title="Add to prompt"
            onClick={onPlus}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
