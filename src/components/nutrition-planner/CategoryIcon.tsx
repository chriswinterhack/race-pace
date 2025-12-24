"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "./types";
import { CATEGORY_CONFIG } from "./types";

interface CategoryIconProps {
  category: ProductCategory;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-4 h-4 text-sm",
  md: "w-6 h-6 text-base",
  lg: "w-9 h-9 text-lg",
};

const IMAGE_SIZES = {
  sm: 16,
  md: 24,
  lg: 36,
};

export function CategoryIcon({ category, size = "md", className }: CategoryIconProps) {
  const config = CATEGORY_CONFIG[category];
  const sizeClass = SIZE_CLASSES[size];
  const imageSize = IMAGE_SIZES[size];

  if (config.iconImage) {
    return (
      <div className={cn("relative flex-shrink-0", sizeClass, className)}>
        <Image
          src={config.iconImage}
          alt={config.label}
          width={imageSize}
          height={imageSize}
          className="object-contain w-full h-full"
        />
      </div>
    );
  }

  return (
    <span className={cn("flex-shrink-0", sizeClass, className)}>
      {config.icon}
    </span>
  );
}
