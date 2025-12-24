"use client";

import {
  Bike,
  Circle,
  Droplets,
  Package,
  Wrench,
  Shirt,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type GearCategory =
  | "bikes"
  | "tires"
  | "shoes"
  | "hydration_packs"
  | "bags"
  | "repair_kits"
  | "clothing";

const categoryIcons: Record<GearCategory, LucideIcon> = {
  bikes: Bike,
  tires: Circle,
  shoes: Bike, // Cycling shoes
  hydration_packs: Droplets,
  bags: Package,
  repair_kits: Wrench,
  clothing: Shirt,
};

const categoryLabels: Record<GearCategory, string> = {
  bikes: "Bikes",
  tires: "Tires",
  shoes: "Shoes",
  hydration_packs: "Hydration",
  bags: "On Bike Storage",
  repair_kits: "Repair Kit",
  clothing: "Clothing",
};

interface GearCategoryIconProps {
  category: GearCategory;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function GearCategoryIcon({
  category,
  size = "md",
  showLabel = false,
  className,
}: GearCategoryIconProps) {
  const Icon = categoryIcons[category];
  const label = categoryLabels[category];

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn(sizeClasses[size], "text-brand-sky-500")} />
      {showLabel && (
        <span className="text-sm font-medium text-brand-navy-700">{label}</span>
      )}
    </div>
  );
}

export { categoryLabels, categoryIcons };
