"use client";

import { cn } from "@/lib/utils";
import type { GearAggregation } from "@/types/race-detail";

interface GearSectionProps {
  title: string;
  icon: React.ReactNode;
  items: GearAggregation[];
  color: "sky" | "amber";
}

export function GearSection({ title, icon, items, color }: GearSectionProps) {
  const topItems = items.slice(0, 5);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "p-2 rounded-lg",
            color === "sky"
              ? "bg-brand-sky-100 text-brand-sky-600"
              : "bg-amber-100 text-amber-600"
          )}
        >
          {icon}
        </span>
        <h3 className="font-semibold text-brand-navy-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {topItems.map((item, index) => (
          <div
            key={`${item.brand}-${item.model}-${item.width || ""}-${index}`}
            className="group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-brand-navy-900">
                {item.brand} {item.model}
                {item.width && (
                  <span className="ml-1.5 text-sm font-normal text-brand-navy-500">
                    ({item.width})
                  </span>
                )}
              </span>
              <span className="text-sm text-brand-navy-500">
                {item.count} {item.count === 1 ? "rider" : "riders"} ·{" "}
                {item.percentage}%
              </span>
            </div>
            <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  color === "sky" ? "bg-brand-sky-500" : "bg-amber-500"
                )}
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  opacity: 1 - index * 0.1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
