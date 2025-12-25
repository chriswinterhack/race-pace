import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedGearDisplayProps } from "./types";

export function SelectedGearDisplay({
  title,
  subtitle,
  imageUrl,
  icon: Icon,
  popularity,
  compact,
}: SelectedGearDisplayProps) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      {imageUrl ? (
        <div
          className={cn(
            "rounded-xl overflow-hidden flex-shrink-0 bg-brand-navy-100",
            compact ? "w-12 h-12" : "w-16 h-16"
          )}
        >
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        Icon && (
          <div
            className={cn(
              "rounded-xl bg-gradient-to-br from-brand-navy-700 to-brand-navy-800 flex-shrink-0 flex items-center justify-center",
              compact ? "w-12 h-12" : "w-16 h-16"
            )}
          >
            <Icon className={cn("text-white", compact ? "h-6 w-6" : "h-8 w-8")} />
          </div>
        )
      )}
      <div className="min-w-0">
        <p className={cn("font-medium text-brand-navy-900 truncate", compact && "text-sm")}>
          {title}
        </p>
        {subtitle && (
          <p className={cn("text-brand-navy-500 truncate", compact ? "text-xs" : "text-sm")}>
            {subtitle}
          </p>
        )}
        {popularity && popularity.count > 1 && !compact && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Award className="h-3 w-3" />
            {popularity.percentage}% of riders chose this
          </p>
        )}
      </div>
    </div>
  );
}
