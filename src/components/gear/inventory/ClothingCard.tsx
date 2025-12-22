"use client";

import { Shirt, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserClothing } from "@/types/gear";
import { CLOTHING_TYPE_LABELS } from "@/types/gear";

interface ClothingCardProps {
  clothing: UserClothing;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

function getClothingGradient(clothingType: string): string {
  const gradients: Record<string, string> = {
    jersey: "from-blue-600 via-indigo-500 to-purple-600",
    bibs: "from-slate-700 via-gray-600 to-zinc-700",
    jacket: "from-red-600 via-rose-500 to-pink-600",
    vest: "from-amber-600 via-orange-500 to-yellow-600",
    arm_warmers: "from-teal-600 via-cyan-500 to-blue-600",
    leg_warmers: "from-emerald-600 via-green-500 to-teal-600",
    gloves: "from-violet-600 via-purple-500 to-indigo-600",
    socks: "from-rose-600 via-pink-500 to-fuchsia-600",
    base_layer: "from-sky-600 via-blue-500 to-indigo-600",
    rain_jacket: "from-gray-600 via-slate-500 to-zinc-600",
  };
  return gradients[clothingType] || "from-brand-navy-700 via-brand-navy-600 to-brand-sky-700";
}

export function ClothingCard({
  clothing,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: ClothingCardProps) {
  const CardWrapper = selectable ? "button" : "div";
  const gradient = getClothingGradient(clothing.clothing_type);

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
        {/* Shirt Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2 rounded-lg bg-white shadow-lg border-2 border-white">
            <Shirt className="h-5 w-5 text-brand-navy-700" />
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
          <h4 className="font-heading font-bold text-brand-navy-900">{clothing.name}</h4>
          {clothing.brand && (
            <p className="text-sm text-brand-navy-600">{clothing.brand}</p>
          )}
        </div>

        <div className="mt-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            clothing.clothing_type === "jersey" && "bg-blue-100 text-blue-700",
            clothing.clothing_type === "bibs" && "bg-slate-100 text-slate-700",
            clothing.clothing_type === "jacket" && "bg-red-100 text-red-700",
            clothing.clothing_type === "vest" && "bg-amber-100 text-amber-700",
            !["jersey", "bibs", "jacket", "vest"].includes(clothing.clothing_type) && "bg-brand-navy-100 text-brand-navy-600"
          )}>
            {CLOTHING_TYPE_LABELS[clothing.clothing_type]}
          </span>
        </div>

        {clothing.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{clothing.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
