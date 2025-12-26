"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
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

interface SortableItemProps {
  item: DropBagItem;
  index: number;
  locationIndex: number;
  onRemove: () => void;
  onToggleCritical: () => void;
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

export function SortableItem({
  item,
  index,
  locationIndex,
  onRemove,
  onToggleCritical,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "item",
      item,
      index,
      locationIndex,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-white border transition-all group",
        isDragging
          ? "border-brand-sky-400 shadow-lg ring-2 ring-brand-sky-200 opacity-50"
          : "border-brand-navy-100 hover:border-brand-navy-200",
        item.is_critical && "border-red-200 bg-red-50/50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-brand-navy-300 hover:text-brand-navy-500 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

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
        {item.notes && (
          <p className="text-xs text-brand-navy-500 truncate">{item.notes}</p>
        )}
      </div>

      {/* Critical Indicator / Toggle */}
      <button
        onClick={onToggleCritical}
        className={cn(
          "p-1.5 rounded transition-colors",
          item.is_critical
            ? "text-red-500 hover:text-red-600"
            : "text-brand-navy-300 hover:text-amber-500 opacity-0 group-hover:opacity-100"
        )}
        title={item.is_critical ? "Remove critical flag" : "Mark as critical"}
      >
        <Star className={cn("h-4 w-4", item.is_critical && "fill-current")} />
      </button>

      {/* Delete Button */}
      <button
        onClick={onRemove}
        className="p-1.5 text-brand-navy-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
