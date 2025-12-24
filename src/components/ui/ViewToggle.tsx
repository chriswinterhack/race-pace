"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ViewMode = "visual" | "table";

interface ViewOption {
  value: ViewMode;
  icon: React.ReactNode;
  label: string;
}

interface ViewToggleProps {
  options: ViewOption[];
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  storageKey?: string;
  className?: string;
}

export function ViewToggle({
  options,
  value,
  onChange,
  storageKey,
  className,
}: ViewToggleProps) {
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load persisted preference
  useEffect(() => {
    if (storageKey && mounted) {
      const saved = localStorage.getItem(storageKey);
      if (saved && options.some((opt) => opt.value === saved)) {
        onChange(saved as ViewMode);
      }
    }
  }, [storageKey, mounted, options, onChange]);

  // Persist preference
  const handleChange = (newValue: ViewMode) => {
    onChange(newValue);
    if (storageKey) {
      localStorage.setItem(storageKey, newValue);
    }
  };

  // Find active index for indicator positioning
  const activeIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div
      className={cn(
        "relative inline-flex items-center p-1 rounded-xl",
        "bg-brand-navy-100",
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded-lg",
          "bg-white shadow-sm",
          "transition-all duration-200 ease-out"
        )}
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${options.length}))`,
        }}
      />

      {/* Options */}
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(
              "relative z-10 flex items-center gap-2 px-3 py-2 rounded-lg",
              "text-sm font-medium",
              "transition-colors duration-200",
              isActive
                ? "text-brand-navy-900"
                : "text-brand-navy-500 hover:text-brand-navy-700"
            )}
            title={option.label}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
