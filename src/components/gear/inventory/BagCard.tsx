"use client";

import { Package, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserBag } from "@/types/gear";
import { BAG_TYPE_LABELS } from "@/types/gear";

interface BagCardProps {
  bag: UserBag;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

function getBagGradient(bagType: string): string {
  const gradients: Record<string, string> = {
    saddle: "from-amber-700 via-orange-600 to-red-700",
    frame: "from-slate-700 via-gray-600 to-zinc-700",
    handlebar: "from-teal-600 via-cyan-500 to-blue-600",
    top_tube: "from-violet-600 via-purple-500 to-indigo-600",
    stem: "from-emerald-600 via-green-500 to-teal-600",
    feed: "from-rose-600 via-pink-500 to-purple-600",
  };
  return gradients[bagType] || "from-brand-navy-700 via-brand-navy-600 to-brand-sky-700";
}

export function BagCard({
  bag,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: BagCardProps) {
  const CardWrapper = selectable ? "button" : "div";
  const gradient = getBagGradient(bag.bag_type);

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
        {/* Bag Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2 rounded-lg bg-white shadow-lg border-2 border-white">
            <Package className="h-5 w-5 text-brand-navy-700" />
          </div>
        </div>

        {/* Capacity badge */}
        {bag.capacity_liters && (
          <div className="absolute bottom-2 right-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-mono font-bold text-brand-navy-700">
              {bag.capacity_liters}L
            </span>
          </div>
        )}

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
            {bag.brand}
          </h4>
          <p className="text-sm text-brand-navy-600">{bag.model}</p>
        </div>

        <div className="mt-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            bag.bag_type === "saddle" && "bg-amber-100 text-amber-700",
            bag.bag_type === "frame" && "bg-slate-100 text-slate-700",
            bag.bag_type === "handlebar" && "bg-teal-100 text-teal-700",
            bag.bag_type === "top_tube" && "bg-violet-100 text-violet-700",
            bag.bag_type === "stem" && "bg-emerald-100 text-emerald-700",
            bag.bag_type === "feed" && "bg-rose-100 text-rose-700"
          )}>
            {BAG_TYPE_LABELS[bag.bag_type]}
          </span>
        </div>

        {bag.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{bag.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
