"use client";

import { useMemo } from "react";
import { Search, Heart, X, Coffee, Plus } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { CategoryIcon } from "./CategoryIcon";
import { useNutritionPlannerStore, useFilteredProducts } from "@/stores/nutritionPlannerStore";
import type { ProductCategory, NutritionProduct } from "./types";
import { CATEGORY_CONFIG } from "./types";

const ALL_CATEGORIES: ProductCategory[] = [
  "gel",
  "chew",
  "bar",
  "drink_mix",
  "real_food",
  "electrolyte",
];

interface ProductPaletteProps {
  className?: string;
  variant?: "desktop" | "mobile";
  onProductTap?: (product: NutritionProduct) => void;
  selectedHourIndex?: number | null;
}

export function ProductPalette({
  className,
  variant = "desktop",
  onProductTap,
  selectedHourIndex,
}: ProductPaletteProps) {
  const filters = useNutritionPlannerStore((s) => s.filters);
  const setFilters = useNutritionPlannerStore((s) => s.setFilters);
  const setFilterCategory = useNutritionPlannerStore((s) => s.setFilterCategory);
  const favoriteIds = useNutritionPlannerStore((s) => s.favoriteProductIds);
  const toggleFavorite = useNutritionPlannerStore((s) => s.toggleFavorite);

  const filteredProducts = useFilteredProducts();

  // Group products by category for display
  const groupedProducts = useMemo(() => {
    const groups: Record<ProductCategory, typeof filteredProducts> = {
      gel: [],
      chew: [],
      bar: [],
      drink_mix: [],
      real_food: [],
      electrolyte: [],
      other: [],
    };

    for (const product of filteredProducts) {
      groups[product.category].push(product);
    }

    return groups;
  }, [filteredProducts]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<ProductCategory, number> = {
      gel: 0,
      chew: 0,
      bar: 0,
      drink_mix: 0,
      real_food: 0,
      electrolyte: 0,
      other: 0,
    };

    for (const product of filteredProducts) {
      counts[product.category]++;
    }

    return counts;
  }, [filteredProducts]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const toggleCategory = (category: ProductCategory) => {
    const isActive = filters.categories.includes(category);
    setFilterCategory(category, !isActive);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      categories: [],
      caffeineOnly: false,
      caffeineeFree: false,
      favoritesOnly: false,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.caffeineOnly ||
    filters.caffeineeFree ||
    filters.favoritesOnly;

  // Mobile variant
  if (variant === "mobile") {
    return (
      <div className={cn("flex flex-col h-full bg-brand-navy-950", className)}>
        {/* Search & Filters */}
        <div className="sticky top-0 z-20 bg-brand-navy-900/95 backdrop-blur-xl">
          {/* Search */}
          <div className="p-3 border-b border-brand-navy-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 rounded-xl",
                  "bg-brand-navy-800 border border-brand-navy-700",
                  "text-white placeholder:text-brand-navy-500",
                  "focus:outline-none focus:ring-2 focus:ring-brand-sky-500 focus:border-transparent",
                  "text-sm"
                )}
              />
              {filters.search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-brand-navy-700 rounded-lg"
                >
                  <X className="h-4 w-4 text-brand-navy-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills - Horizontal scroll */}
          <div className="px-3 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              {ALL_CATEGORIES.map((category) => {
                const config = CATEGORY_CONFIG[category];
                const isActive = filters.categories.length === 0 || filters.categories.includes(category);
                const count = categoryCounts[category];

                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                      "transition-all duration-150 active:scale-95",
                      isActive
                        ? "bg-brand-navy-700 text-white"
                        : "bg-brand-navy-800/50 text-brand-navy-500"
                    )}
                  >
                    <CategoryIcon category={category} size="sm" />
                    <span>{config.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                        isActive ? "bg-brand-navy-600" : "bg-brand-navy-700"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "transition-all duration-150 active:scale-95",
                filters.favoritesOnly
                  ? "bg-red-500/20 text-red-400"
                  : "bg-brand-navy-800/50 text-brand-navy-500"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", filters.favoritesOnly && "fill-current")} />
              Favorites
            </button>
            <button
              onClick={() => setFilters({ caffeineOnly: !filters.caffeineOnly, caffeineeFree: false })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "transition-all duration-150 active:scale-95",
                filters.caffeineOnly
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-brand-navy-800/50 text-brand-navy-500"
              )}
            >
              <Coffee className="h-3.5 w-3.5" />
              Caffeinated
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-brand-navy-500 hover:text-brand-navy-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-brand-navy-400 mb-2">No products found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-brand-sky-400 hover:text-brand-sky-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {ALL_CATEGORIES.map((category) => {
                const products = groupedProducts[category];
                if (products.length === 0) return null;

                const config = CATEGORY_CONFIG[category];

                return (
                  <div key={category}>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy-300 mb-2 px-1">
                      <CategoryIcon category={category} size="sm" />
                      {config.label}
                      <span className="text-brand-navy-500 font-normal">
                        ({products.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {products.map((product) => (
                        <MobileProductCard
                          key={product.id}
                          product={product}
                          isFavorite={favoriteIds.includes(product.id)}
                          onFavoriteToggle={() => toggleFavorite(product.id)}
                          onTap={onProductTap}
                          hasSelectedHour={selectedHourIndex !== null}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tap to add hint */}
        {selectedHourIndex === null && (
          <div className="sticky bottom-0 px-4 py-3 bg-gradient-to-t from-brand-navy-950 via-brand-navy-950 to-transparent">
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-sky-500/10 border border-brand-sky-500/20">
              <span className="text-sm text-brand-sky-400">
                Select an hour first to add products
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop variant (original)
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-white border-r border-brand-navy-200",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-brand-navy-100">
        <h2 className="text-lg font-semibold text-brand-navy-900 mb-3">
          Products
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-brand-navy-100 rounded"
            >
              <X className="h-4 w-4 text-brand-navy-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 py-3 border-b border-brand-navy-100">
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const isActive = filters.categories.length === 0 || filters.categories.includes(category);
            const count = categoryCounts[category];

            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                  "transition-all duration-150",
                  isActive
                    ? config.color
                    : "bg-brand-navy-50 text-brand-navy-400"
                )}
              >
                <CategoryIcon category={category} size="sm" />
                <span>{config.label}</span>
                {count > 0 && (
                  <span className="ml-0.5 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              "transition-all duration-150",
              filters.favoritesOnly
                ? "bg-red-100 text-red-800"
                : "bg-brand-navy-50 text-brand-navy-500 hover:bg-brand-navy-100"
            )}
          >
            <Heart className={cn("h-3 w-3", filters.favoritesOnly && "fill-current")} />
            Favorites
          </button>

          <button
            onClick={() => setFilters({ caffeineOnly: !filters.caffeineOnly, caffeineeFree: false })}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              "transition-all duration-150",
              filters.caffeineOnly
                ? "bg-amber-100 text-amber-800"
                : "bg-brand-navy-50 text-brand-navy-500 hover:bg-brand-navy-100"
            )}
          >
            <Coffee className="h-3 w-3" />
            Caffeinated
          </button>

          <button
            onClick={() => setFilters({ caffeineeFree: !filters.caffeineeFree, caffeineOnly: false })}
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
              "transition-all duration-150",
              filters.caffeineeFree
                ? "bg-green-100 text-green-800"
                : "bg-brand-navy-50 text-brand-navy-500 hover:bg-brand-navy-100"
            )}
          >
            Caffeine-free
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-brand-navy-500 hover:text-brand-navy-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Products list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-brand-navy-500 text-sm">No products found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-brand-sky-600 hover:text-brand-sky-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {ALL_CATEGORIES.map((category) => {
              const products = groupedProducts[category];
              if (products.length === 0) return null;

              const config = CATEGORY_CONFIG[category];

              return (
                <div key={category}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy-700 mb-2">
                    <CategoryIcon category={category} size="md" />
                    {config.label}
                    <span className="text-brand-navy-400 font-normal">
                      ({products.length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isFavorite={favoriteIds.includes(product.id)}
                        onFavoriteToggle={() => toggleFavorite(product.id)}
                        isDraggable
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 border-t border-brand-navy-100 bg-brand-navy-50">
        <p className="text-xs text-brand-navy-500 text-center">
          Drag products to the timeline →
        </p>
      </div>
    </div>
  );
}

// Mobile Product Card - optimized for touch
function MobileProductCard({
  product,
  isFavorite,
  onFavoriteToggle,
  onTap,
  hasSelectedHour,
}: {
  product: NutritionProduct;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onTap?: (product: NutritionProduct) => void;
  hasSelectedHour: boolean;
}) {
  const categoryConfig = CATEGORY_CONFIG[product.category];
  const caffeineMg = Number(product.caffeineMg) || 0;
  const hasCaffeine = caffeineMg > 0;

  return (
    <div
      onClick={() => onTap?.(product)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-brand-navy-900/50 border border-brand-navy-800",
        "transition-all duration-150",
        hasSelectedHour && "active:scale-[0.98] active:bg-brand-navy-800 cursor-pointer"
      )}
    >
      {/* Category Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        categoryConfig.color
      )}>
        <CategoryIcon category={product.category} size="lg" />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-brand-navy-500 uppercase tracking-wide">
          {product.brand}
        </p>
        <p className="font-semibold text-white text-sm leading-tight truncate">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-amber-400 font-medium">{product.carbsGrams}g carbs</span>
          <span className="text-brand-navy-600">·</span>
          <span className="text-xs text-brand-navy-400">{product.calories} cal</span>
          {hasCaffeine && (
            <>
              <span className="text-brand-navy-600">·</span>
              <span className="text-xs text-amber-500 flex items-center gap-0.5">
                <Coffee className="h-3 w-3" />
                {caffeineMg}mg
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isFavorite
              ? "text-red-400 bg-red-500/10"
              : "text-brand-navy-600 hover:bg-brand-navy-800"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>

        {hasSelectedHour && (
          <div className="w-10 h-10 rounded-xl bg-brand-sky-500 flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
