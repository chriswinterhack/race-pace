"use client";

import { useMemo } from "react";
import { Search, Heart, X, Coffee } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { CategoryIcon } from "./CategoryIcon";
import { useNutritionPlannerStore, useFilteredProducts } from "@/stores/nutritionPlannerStore";
import type { ProductCategory } from "./types";
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
}

export function ProductPalette({ className }: ProductPaletteProps) {
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
