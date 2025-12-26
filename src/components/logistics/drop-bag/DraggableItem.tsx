"use client";

import {
  GripVertical,
  Star,
  Package,
  Shirt,
  Wrench,
  Zap,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DropBagItem, CustomItemCategory } from "@/types/logistics";

interface DraggableItemProps {
  item: DropBagItem;
  isDragging?: boolean;
}

const CATEGORY_ICONS: Record<CustomItemCategory, React.ElementType> = {
  nutrition: Package,
  clothing: Shirt,
  repair: Wrench,
  electronics: Zap,
  medical: Heart,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<CustomItemCategory, string> = {
  nutrition: "bg-orange-100 text-orange-700",
  clothing: "bg-blue-100 text-blue-700",
  repair: "bg-gray-100 text-gray-700",
  electronics: "bg-purple-100 text-purple-700",
  medical: "bg-red-100 text-red-700",
  other: "bg-brand-navy-100 text-brand-navy-700",
};

export function DraggableItem({ item, isDragging }: DraggableItemProps) {
  // Get display info
  const displayName = item.source_type === "custom"
    ? item.custom_name
    : item.gear_item?.name || "Unknown Item";

  const CategoryIcon = item.source_type === "custom" && item.custom_category
    ? CATEGORY_ICONS[item.custom_category]
    : Package;

  const categoryColor = item.source_type === "custom" && item.custom_category
    ? CATEGORY_COLORS[item.custom_category]
    : "bg-brand-navy-100 text-brand-navy-700";

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-white border shadow-xl",
        isDragging
          ? "border-brand-sky-400 ring-2 ring-brand-sky-200"
          : "border-brand-navy-200",
        item.is_critical && "border-red-300 bg-red-50"
      )}
    >
      {/* Drag Handle */}
      <div className="p-1 text-brand-navy-400">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Category Icon */}
      <div className={cn("p-1.5 rounded", categoryColor)}>
        <CategoryIcon className="h-3.5 w-3.5" />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-navy-900 truncate">
          {displayName}
          {item.quantity > 1 && (
            <span className="ml-1 text-brand-navy-500">x{item.quantity}</span>
          )}
        </p>
      </div>

      {/* Critical Indicator */}
      {item.is_critical && (
        <Star className="h-4 w-4 text-red-500 fill-current" />
      )}
    </div>
  );
}
