"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Heart, Coffee, Droplets, Zap, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasOptimalCarbMix } from "@/lib/calculations";
import type { NutritionProduct } from "./types";
import { CATEGORY_CONFIG } from "./types";
import { CategoryIcon } from "./CategoryIcon";

interface ProductCardProps {
  product: NutritionProduct;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  isDraggable?: boolean;
  isCompact?: boolean;
  className?: string;
}

/**
 * Get a human-readable explanation of the glucose:fructose ratio
 */
function getRatioExplanation(ratio: string | null): { label: string; description: string; quality: "optimal" | "good" | "basic" } {
  if (!ratio) return { label: "Unknown", description: "Ratio not specified", quality: "basic" };

  const isOptimal = hasOptimalCarbMix(ratio);

  if (ratio === "1:0.8" || ratio === "1:1") {
    return {
      label: "Optimal Mix",
      description: "Best absorption - uses both glucose & fructose transporters",
      quality: "optimal",
    };
  }

  if (ratio === "2:1") {
    return {
      label: "Dual Transport",
      description: "Good absorption with 2:1 glucose to fructose",
      quality: isOptimal ? "optimal" : "good",
    };
  }

  if (ratio.toLowerCase().includes("glucose") && ratio.toLowerCase().includes("fructose")) {
    return {
      label: "Mixed Sugars",
      description: "Contains both glucose and fructose sources",
      quality: "good",
    };
  }

  if (ratio.toLowerCase() === "glucose-only" || ratio.toLowerCase() === "maltodextrin") {
    return {
      label: "Single Transport",
      description: "Only uses glucose transporter - limits absorption to ~60g/hr",
      quality: "basic",
    };
  }

  return {
    label: ratio,
    description: "Sugar composition",
    quality: isOptimal ? "optimal" : "good",
  };
}

export function ProductCard({
  product,
  isFavorite = false,
  onFavoriteToggle,
  isDraggable = true,
  isCompact = false,
  className,
}: ProductCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `product-${product.id}`,
    data: {
      type: "product",
      product,
    },
    disabled: !isDraggable,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const categoryConfig = CATEGORY_CONFIG[product.category];
  const ratioInfo = getRatioExplanation(product.glucoseFructoseRatio);
  // Ensure caffeine check handles null, undefined, 0, and string "0"
  const caffeineMg = Number(product.caffeineMg) || 0;
  const hasCaffeine = caffeineMg > 0;
  const waterMl = Number(product.waterContentMl) || 0;
  const hasWater = waterMl > 0;

  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(isDraggable ? { ...listeners, ...attributes } : {})}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg",
          "bg-white border border-brand-navy-200",
          "transition-all duration-150",
          isDraggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 shadow-lg",
          className
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          categoryConfig.color
        )}>
          <CategoryIcon category={product.category} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-navy-900 truncate">
            {product.name}
          </p>
          <p className="text-xs text-brand-navy-500 tabular-nums">
            {product.carbsGrams}g carbs · {product.calories} cal
          </p>
        </div>
        {hasCaffeine && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
            <Coffee className="h-3 w-3" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "bg-white border border-brand-navy-200",
        "transition-all duration-200",
        isDraggable && "cursor-grab active:cursor-grabbing hover:border-brand-sky-400 hover:shadow-lg hover:shadow-brand-sky-100/50",
        isDragging && "opacity-50 shadow-xl ring-2 ring-brand-sky-400",
        className
      )}
    >
      {/* Top colored bar based on category */}
      <div className={cn("h-1", categoryConfig.color.replace("text-", "bg-").split(" ")[0])} />

      <div className="p-3">
        {/* Favorite button */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onFavoriteToggle();
            }}
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200",
              "hover:scale-110",
              isFavorite
                ? "text-red-500 bg-red-50"
                : "text-brand-navy-300 opacity-0 group-hover:opacity-100 hover:bg-brand-navy-50"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>
        )}

        {/* Header row: category + caffeine */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
              categoryConfig.color
            )}
          >
            <CategoryIcon category={product.category} size="sm" />
            {categoryConfig.label}
          </span>

          {hasCaffeine && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800">
              <Coffee className="h-3 w-3" />
              {caffeineMg}mg
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-brand-navy-400 uppercase tracking-wider">
            {product.brand}
          </p>
          <p className="text-sm font-semibold text-brand-navy-900 leading-snug pr-6">
            {product.name}
          </p>
          {product.servingSize && (
            <p className="text-xs text-brand-navy-400 mt-0.5">
              {product.servingSize}
            </p>
          )}
        </div>

        {/* Macros grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Zap className="h-3 w-3 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-amber-900 tabular-nums">{product.carbsGrams}g</p>
            <p className="text-[10px] text-amber-700 font-medium">CARBS</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gradient-to-br from-brand-navy-50 to-slate-50 border border-brand-navy-100">
            <p className="text-sm font-bold text-brand-navy-900 tabular-nums mt-1">{product.calories}</p>
            <p className="text-[10px] text-brand-navy-600 font-medium">KCAL</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
            <p className="text-sm font-bold text-purple-900 tabular-nums mt-1">{product.sodiumMg}</p>
            <p className="text-[10px] text-purple-700 font-medium">MG NA</p>
          </div>
        </div>

        {/* Glucose:Fructose ratio indicator */}
        {product.glucoseFructoseRatio && (
          <div className={cn(
            "flex items-start gap-2 p-2 rounded-lg text-xs",
            ratioInfo.quality === "optimal" && "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200",
            ratioInfo.quality === "good" && "bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200",
            ratioInfo.quality === "basic" && "bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200"
          )}>
            <div className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
              ratioInfo.quality === "optimal" && "bg-green-500 text-white",
              ratioInfo.quality === "good" && "bg-blue-500 text-white",
              ratioInfo.quality === "basic" && "bg-slate-400 text-white"
            )}>
              {ratioInfo.quality === "optimal" ? "✓" : ratioInfo.quality === "good" ? "○" : "−"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-semibold",
                ratioInfo.quality === "optimal" && "text-green-800",
                ratioInfo.quality === "good" && "text-blue-800",
                ratioInfo.quality === "basic" && "text-slate-700"
              )}>
                {ratioInfo.label} <span className="font-normal opacity-75">({product.glucoseFructoseRatio})</span>
              </p>
              <p className={cn(
                "text-[10px] leading-tight",
                ratioInfo.quality === "optimal" && "text-green-700",
                ratioInfo.quality === "good" && "text-blue-700",
                ratioInfo.quality === "basic" && "text-slate-600"
              )}>
                {ratioInfo.description}
              </p>
            </div>
          </div>
        )}

        {/* Hydration content */}
        {hasWater && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-brand-sky-700">
            <Droplets className="h-3.5 w-3.5" />
            <span className="font-medium">+{waterMl}ml fluid</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Product chip for display in timeline - shows full details
 */
export function ProductChip({
  product,
  quantity = 1,
  fluidMl,
  onRemove,
  onQuantityChange,
  onFluidChange,
  className,
}: {
  product: NutritionProduct;
  quantity?: number;
  fluidMl?: number;
  onRemove?: () => void;
  onQuantityChange?: (qty: number) => void;
  onFluidChange?: (ml: number) => void;
  className?: string;
}) {
  const categoryConfig = CATEGORY_CONFIG[product.category];

  // Safely convert numeric values
  const caffeineMg = Number(product.caffeineMg) || 0;
  const hasCaffeine = caffeineMg > 0;
  const productWaterMl = Number(product.waterContentMl) || 0;
  const isDrinkMix = product.category === "drink_mix";

  // Calculate totals based on quantity
  const totalCarbs = product.carbsGrams * quantity;
  const totalSodium = product.sodiumMg * quantity;
  const totalCaffeine = caffeineMg * quantity;
  // For drinks, use the custom fluid amount if provided, otherwise use product's water content
  const totalFluid = isDrinkMix && fluidMl !== undefined ? fluidMl : productWaterMl * quantity;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl",
        "bg-white shadow-md",
        "hover:shadow-lg transition-all duration-150",
        className
      )}
    >
      {/* Category icon */}
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
        categoryConfig.color
      )}>
        <CategoryIcon category={product.category} size="lg" />
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-brand-navy-400 uppercase tracking-wide">
            {product.brand}
          </span>
          {hasCaffeine && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
              <Coffee className="h-2.5 w-2.5" />
              {totalCaffeine}mg
            </span>
          )}
        </div>
        <p className="font-semibold text-brand-navy-900 text-sm leading-tight">
          {product.name}
        </p>
      </div>

      {/* Quantity controls - always visible */}
      {onQuantityChange && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuantityChange(Math.max(1, quantity - 1));
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-navy-100 hover:bg-brand-navy-200 text-brand-navy-700 transition-colors font-bold"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center font-bold text-brand-navy-900 tabular-nums">
            {quantity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuantityChange(quantity + 1);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-navy-100 hover:bg-brand-navy-200 text-brand-navy-700 transition-colors font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Macro badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Carbs */}
        <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-amber-100 shadow-sm">
          <span className="text-xs font-bold text-amber-800 tabular-nums">{totalCarbs}g</span>
          <span className="text-[9px] text-amber-600 font-medium">carbs</span>
        </div>

        {/* Fluid - with controls for drink mixes */}
        {(totalFluid > 0 || isDrinkMix) && (
          <div className="flex items-center gap-1">
            {isDrinkMix && onFluidChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onFluidChange(Math.max(100, (fluidMl || 500) - 100));
                }}
                className="w-5 h-5 flex items-center justify-center rounded bg-sky-200 hover:bg-sky-300 text-sky-700 transition-colors"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
            )}
            <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-sky-100 shadow-sm">
              <span className="text-xs font-bold text-sky-800 tabular-nums">{totalFluid}ml</span>
              <span className="text-[9px] text-sky-600 font-medium">fluid</span>
            </div>
            {isDrinkMix && onFluidChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onFluidChange((fluidMl || 500) + 100);
                }}
                className="w-5 h-5 flex items-center justify-center rounded bg-sky-200 hover:bg-sky-300 text-sky-700 transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Sodium */}
        <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-purple-100 shadow-sm">
          <span className="text-xs font-bold text-purple-800 tabular-nums">{totalSodium}mg</span>
          <span className="text-[9px] text-purple-600 font-medium">sodium</span>
        </div>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-navy-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          aria-label="Remove product"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
