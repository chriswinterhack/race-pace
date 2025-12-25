"use client";

import { cn } from "@/lib/utils";

interface CountdownUnitProps {
  value: number;
  label: string;
  small?: boolean;
}

export function CountdownUnit({ value, label, small = false }: CountdownUnitProps) {
  return (
    <div className={cn("text-center", small ? "opacity-70" : "")}>
      <div
        className={cn(
          "font-mono font-bold text-white tabular-nums",
          small ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl lg:text-6xl"
        )}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <div
        className={cn(
          "text-white/60 uppercase tracking-wider",
          small ? "text-[10px]" : "text-xs"
        )}
      >
        {label}
      </div>
    </div>
  );
}
