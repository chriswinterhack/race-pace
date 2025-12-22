"use client";

import { Footprints, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserShoe } from "@/types/gear";
import { SHOE_TYPE_LABELS, CLEAT_TYPE_LABELS } from "@/types/gear";

interface ShoeCardProps {
  shoe: UserShoe;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

function getShoeGradient(shoeType: string | null): string {
  const gradients: Record<string, string> = {
    road: "from-rose-600 via-pink-500 to-purple-600",
    mtb: "from-stone-600 via-amber-600 to-yellow-700",
    gravel: "from-orange-600 via-amber-500 to-yellow-600",
  };
  return gradients[shoeType || ""] || "from-brand-navy-700 via-brand-navy-600 to-brand-sky-700";
}

export function ShoeCard({
  shoe,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: ShoeCardProps) {
  const CardWrapper = selectable ? "button" : "div";
  const gradient = getShoeGradient(shoe.shoe_type);

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
      <div className={cn("relative h-14 bg-gradient-to-r", gradient)}>
        {/* Shoe Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2 rounded-lg bg-white shadow-lg border-2 border-white">
            <Footprints className="h-5 w-5 text-brand-navy-700" />
          </div>
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
            {shoe.brand}
          </h4>
          <p className="text-sm text-brand-navy-600">{shoe.model}</p>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {shoe.shoe_type && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              shoe.shoe_type === "road" && "bg-rose-100 text-rose-700",
              shoe.shoe_type === "mtb" && "bg-amber-100 text-amber-700",
              shoe.shoe_type === "gravel" && "bg-orange-100 text-orange-700"
            )}>
              {SHOE_TYPE_LABELS[shoe.shoe_type]}
            </span>
          )}
          {shoe.cleat_type && (
            <span className="text-xs text-brand-navy-500 bg-brand-navy-50 px-2 py-0.5 rounded">
              {CLEAT_TYPE_LABELS[shoe.cleat_type]}
            </span>
          )}
        </div>

        {shoe.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{shoe.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
