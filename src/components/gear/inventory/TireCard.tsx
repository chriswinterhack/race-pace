"use client";

import { Circle, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserTire } from "@/types/gear";
import { TIRE_TYPE_LABELS, formatTireWidth } from "@/types/gear";

interface TireCardProps {
  tire: UserTire;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

// Generate gradient based on tire type
function getTireGradient(tireType: string | null): string {
  const gradients: Record<string, string> = {
    tubeless: "from-emerald-600 via-teal-500 to-cyan-600",
    clincher: "from-slate-600 via-gray-500 to-zinc-600",
    tubular: "from-purple-600 via-violet-500 to-indigo-600",
  };
  return gradients[tireType || ""] || "from-brand-navy-700 via-brand-navy-600 to-brand-sky-700";
}

export function TireCard({
  tire,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: TireCardProps) {
  const CardWrapper = selectable ? "button" : "div";
  const gradient = getTireGradient(tire.tire_type);

  return (
    <CardWrapper
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "w-full text-left overflow-hidden rounded-xl border transition-all group",
        selectable && "cursor-pointer",
        selected
          ? "border-brand-sky-500 ring-2 ring-brand-sky-500 shadow-lg"
          : "border-brand-navy-200 bg-white hover:border-brand-navy-300 hover:shadow-md"
      )}
    >
      {/* Gradient Header */}
      <div className={cn("relative h-16 bg-gradient-to-r", gradient)}>
        {/* Tire pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.1) 4px,
              rgba(255,255,255,0.1) 8px
            )`,
          }}
        />

        {/* Tire Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2.5 rounded-full bg-white shadow-lg border-2 border-white">
            <Circle className="h-5 w-5 text-brand-navy-700" />
          </div>
        </div>

        {/* Width badge on header */}
        <div className="absolute bottom-2 right-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-mono font-bold text-brand-navy-700">
            {formatTireWidth(tire.width_value, tire.width_unit)}
          </span>
        </div>

        {/* Selection indicator */}
        {selectable && selected && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-lg">
            <Check className="h-4 w-4 text-brand-sky-500" />
          </div>
        )}

        {/* Actions */}
        {!selectable && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-brand-navy-600"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-6 pb-4 px-4">
        <div>
          <h4 className="font-heading font-bold text-brand-navy-900">
            {tire.brand}
          </h4>
          <p className="text-sm text-brand-navy-600">{tire.model}</p>
        </div>

        {tire.tire_type && (
          <div className="mt-2">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              tire.tire_type === "tubeless" && "bg-emerald-100 text-emerald-700",
              tire.tire_type === "clincher" && "bg-slate-100 text-slate-700",
              tire.tire_type === "tubular" && "bg-purple-100 text-purple-700"
            )}>
              {TIRE_TYPE_LABELS[tire.tire_type]}
            </span>
          </div>
        )}

        {tire.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{tire.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
