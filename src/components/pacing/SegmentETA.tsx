"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCutoffTime, type TimeStatus } from "@/lib/utils/time";

interface SegmentETAProps {
  arrivalTime: string;
  cutoff?: string;
  timeStatus: TimeStatus;
  /** Label to show above the time */
  label?: string;
  /** Compact mode for mobile */
  compact?: boolean;
}

/**
 * Displays the ETA arrival time with optional cutoff information
 * Shows warning/danger indicators when approaching or past cutoff
 */
export function SegmentETA({
  arrivalTime,
  cutoff,
  timeStatus,
  label = "ETA",
  compact = false,
}: SegmentETAProps) {
  return (
    <div className={cn("text-right", !compact && "min-w-[100px] min-h-[44px]")}>
      <p className="text-xs text-brand-navy-500 uppercase tracking-wide">{label}</p>
      <div className={cn("flex items-center justify-end", compact ? "gap-1.5" : "gap-2")}>
        <p
          className={cn(
            "text-lg font-bold",
            timeStatus === "danger" && "text-red-600",
            timeStatus === "warning" && "text-amber-600",
            timeStatus === "ok" && "text-brand-navy-900"
          )}
        >
          {arrivalTime}
        </p>
        {timeStatus !== "ok" && (
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              timeStatus === "danger" && "text-red-500",
              timeStatus === "warning" && "text-amber-500"
            )}
          />
        )}
      </div>
      {cutoff && (
        <p
          className={cn(
            "text-xs",
            timeStatus === "danger" && "text-red-500 font-medium",
            timeStatus === "warning" && "text-amber-600",
            timeStatus === "ok" && "text-brand-navy-400"
          )}
        >
          Cutoff: {formatCutoffTime(cutoff)}
        </p>
      )}
    </div>
  );
}
