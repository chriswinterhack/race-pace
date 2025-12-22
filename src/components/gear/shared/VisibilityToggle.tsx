"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisibilityToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function VisibilityToggle({
  isPublic,
  onChange,
  disabled = false,
  className,
}: VisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!isPublic)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        isPublic
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isPublic ? (
        <>
          <Eye className="h-4 w-4" />
          <span>Public</span>
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4" />
          <span>Private</span>
        </>
      )}
    </button>
  );
}
