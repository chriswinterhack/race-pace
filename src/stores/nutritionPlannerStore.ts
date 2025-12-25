import { create } from "zustand";
import {
  calculateRaceNutritionPlan,
  type HourlyTargets,
  type GutTrainingLevel,
  type SweatRate,
} from "@/lib/calculations/nutritionScience";
import type {
  NutritionProduct,
  TimelineProduct,
  TimelineHour,
  ProductCategory,
  ProductSource,
  ProductFilters,
} from "@/components/nutrition-planner/types";

// ============================================================================
// State Interface
// ============================================================================

interface NutritionPlannerState {
  // Plan identity
  nutritionPlanId: string | null;
  racePlanId: string | null;

  // Race info
  raceDurationHours: number;
  maxElevationFt: number;
  raceStartTime: string;

  // Athlete info
  athleteWeightKg: number;
  gutTrainingLevel: GutTrainingLevel;
  sweatRate: SweatRate;
  knownSweatRateMlPerHour: number | null;

  // Weather
  temperatureF: number;
  humidity: number;

  // Calculated targets
  hourlyTargets: HourlyTargets | null;
  totalTargets: {
    carbs: number;
    calories: number;
    sodium: number;
    fluid: number;
  } | null;
  warnings: string[];
  recommendations: string[];

  // Timeline data
  hours: TimelineHour[];

  // Products
  products: NutritionProduct[];
  favoriteProductIds: string[];

  // UI state
  selectedHourIndex: number | null;
  isDragging: boolean;
  filters: ProductFilters;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setRaceInfo: (info: {
    racePlanId: string;
    raceDurationHours: number;
    maxElevationFt: number;
    raceStartTime: string;
  }) => void;

  setAthleteInfo: (info: {
    weightKg: number;
    gutTrainingLevel?: GutTrainingLevel;
    sweatRate?: SweatRate;
    knownSweatRateMlPerHour?: number | null;
  }) => void;

  setWeather: (weather: { temperatureF: number; humidity: number }) => void;

  recalculateTargets: () => void;

  initializeTimeline: () => void;

  setProducts: (products: NutritionProduct[]) => void;
  setFavorites: (ids: string[]) => void;
  toggleFavorite: (productId: string) => void;

  addProductToHour: (hourIndex: number, product: NutritionProduct, source?: ProductSource) => void;
  removeProductFromHour: (hourIndex: number, productIndex: number) => void;
  updateProductQuantity: (hourIndex: number, productIndex: number, quantity: number) => void;
  updateProductFluid: (hourIndex: number, productIndex: number, fluidMl: number) => void;
  updateProductSource: (hourIndex: number, productIndex: number, source: ProductSource, locationId?: string, locationName?: string) => void;
  moveProduct: (fromHour: number, fromIndex: number, toHour: number) => void;

  setHourWater: (hourIndex: number, waterMl: number, source?: ProductSource) => void;
  clearHour: (hourIndex: number) => void;

  selectHour: (index: number | null) => void;
  setDragging: (isDragging: boolean) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setFilterCategory: (category: ProductCategory, enabled: boolean) => void;

  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;

  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialFilters: ProductFilters = {
  search: "",
  categories: [],
  caffeineOnly: false,
  caffeineeFree: false,
  favoritesOnly: false,
};

const initialState = {
  nutritionPlanId: null,
  racePlanId: null,
  raceDurationHours: 6,
  maxElevationFt: 5000,
  raceStartTime: "06:00",
  athleteWeightKg: 75,
  gutTrainingLevel: "intermediate" as GutTrainingLevel,
  sweatRate: "average" as SweatRate,
  knownSweatRateMlPerHour: null,
  temperatureF: 70,
  humidity: 50,
  hourlyTargets: null,
  totalTargets: null,
  warnings: [],
  recommendations: [],
  hours: [],
  products: [],
  favoriteProductIds: [],
  selectedHourIndex: null,
  isDragging: false,
  filters: initialFilters,
  isLoading: false,
  isSaving: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate totals for a single hour
 */
function calculateHourTotals(products: TimelineProduct[], waterMl: number) {
  let carbs = 0;
  let calories = 0;
  let sodium = 0;
  let caffeine = 0;
  let fluid = waterMl;

  for (const item of products) {
    const p = item.product;
    const qty = item.quantity;
    carbs += p.carbsGrams * qty;
    calories += p.calories * qty;
    sodium += p.sodiumMg * qty;
    caffeine += (p.caffeineMg ?? 0) * qty;

    // For drink mixes, use custom fluid amount if set, otherwise use product's water content
    if (p.category === "drink_mix" && item.fluidMl !== null && item.fluidMl !== undefined) {
      fluid += item.fluidMl;
    } else {
      fluid += (p.waterContentMl ?? 0) * qty;
    }
  }

  return {
    carbs: Math.round(carbs),
    calories: Math.round(calories),
    sodium: Math.round(sodium),
    caffeine: Math.round(caffeine),
    fluid: Math.round(fluid),
  };
}

/**
 * Generate hour time label
 */
function getHourTimeLabel(startTime: string, hourOffset: number): { start: string; end: string } {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(hours ?? 6, minutes ?? 0, 0, 0);

  const hourStart = new Date(startDate.getTime() + hourOffset * 60 * 60 * 1000);
  const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

  const formatTime = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return {
    start: formatTime(hourStart),
    end: formatTime(hourEnd),
  };
}

// ============================================================================
// Store
// ============================================================================

export const useNutritionPlannerStore = create<NutritionPlannerState>((set, get) => ({
  ...initialState,

  // -------------------------------------------------------------------------
  // Race & Athlete Info
  // -------------------------------------------------------------------------

  setRaceInfo: (info) => {
    set({
      racePlanId: info.racePlanId,
      raceDurationHours: info.raceDurationHours,
      maxElevationFt: info.maxElevationFt,
      raceStartTime: info.raceStartTime,
    });
    get().recalculateTargets();
    get().initializeTimeline();
  },

  setAthleteInfo: (info) => {
    set({
      athleteWeightKg: info.weightKg,
      gutTrainingLevel: info.gutTrainingLevel ?? get().gutTrainingLevel,
      sweatRate: info.sweatRate ?? get().sweatRate,
      knownSweatRateMlPerHour: info.knownSweatRateMlPerHour ?? get().knownSweatRateMlPerHour,
    });
    get().recalculateTargets();
  },

  setWeather: (weather) => {
    set({
      temperatureF: weather.temperatureF,
      humidity: weather.humidity,
    });
    get().recalculateTargets();
  },

  // -------------------------------------------------------------------------
  // Target Calculations
  // -------------------------------------------------------------------------

  recalculateTargets: () => {
    const state = get();
    const plan = calculateRaceNutritionPlan({
      raceDurationHours: state.raceDurationHours,
      elevationGainFt: 0, // Not used currently
      maxElevationFt: state.maxElevationFt,
      temperatureF: state.temperatureF,
      humidity: state.humidity,
      athleteWeightKg: state.athleteWeightKg,
      sweatRate: state.sweatRate,
      gutTrainingLevel: state.gutTrainingLevel,
      knownSweatRateMlPerHour: state.knownSweatRateMlPerHour ?? undefined,
    });

    set({
      hourlyTargets: plan.hourlyTargets,
      totalTargets: plan.totalTargets,
      warnings: plan.warnings,
      recommendations: plan.recommendations,
    });
  },

  // -------------------------------------------------------------------------
  // Timeline Management
  // -------------------------------------------------------------------------

  initializeTimeline: () => {
    const { raceDurationHours, raceStartTime, hours: existingHours } = get();
    const numHours = Math.ceil(raceDurationHours);

    // Preserve existing products if reinitializing
    const existingProductsByHour = new Map<number, TimelineProduct[]>();
    const existingWaterByHour = new Map<number, { ml: number; source: ProductSource | null }>();

    for (const h of existingHours) {
      existingProductsByHour.set(h.hourNumber, h.products);
      existingWaterByHour.set(h.hourNumber, { ml: h.waterMl, source: h.waterSource });
    }

    const newHours: TimelineHour[] = [];

    for (let i = 0; i < numHours; i++) {
      const hourNumber = i + 1;
      const times = getHourTimeLabel(raceStartTime, i);
      const existingProducts = existingProductsByHour.get(hourNumber) ?? [];
      const existingWater = existingWaterByHour.get(hourNumber);

      const waterMl = existingWater?.ml ?? 0;

      newHours.push({
        hourNumber,
        startTime: times.start,
        endTime: times.end,
        products: existingProducts,
        waterMl,
        waterSource: existingWater?.source ?? null,
        totals: calculateHourTotals(existingProducts, waterMl),
      });
    }

    set({ hours: newHours });
  },

  // -------------------------------------------------------------------------
  // Products Management
  // -------------------------------------------------------------------------

  setProducts: (products) => set({ products }),

  setFavorites: (ids) => set({ favoriteProductIds: ids }),

  toggleFavorite: (productId) => {
    const { favoriteProductIds } = get();
    const newFavorites = favoriteProductIds.includes(productId)
      ? favoriteProductIds.filter((id) => id !== productId)
      : [...favoriteProductIds, productId];
    set({ favoriteProductIds: newFavorites });
  },

  // -------------------------------------------------------------------------
  // Timeline Product Actions
  // -------------------------------------------------------------------------

  addProductToHour: (hourIndex, product, source = "on_bike") => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour) return;

    const newProduct: TimelineProduct = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      productId: product.id,
      product,
      quantity: 1,
      fluidMl: product.category === "drink_mix" ? 500 : null, // Default 500ml for drink mixes
      source,
      sourceLocationId: null,
      sourceName: null,
      notes: null,
      sortOrder: hour.products.length,
    };

    const updatedProducts = [...hour.products, newProduct];
    const updatedHour: TimelineHour = {
      ...hour,
      products: updatedProducts,
      totals: calculateHourTotals(updatedProducts, hour.waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  removeProductFromHour: (hourIndex, productIndex) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour) return;

    const updatedProducts = hour.products.filter((_, i) => i !== productIndex);
    const updatedHour: TimelineHour = {
      ...hour,
      products: updatedProducts,
      totals: calculateHourTotals(updatedProducts, hour.waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  updateProductQuantity: (hourIndex, productIndex, quantity) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour || !hour.products[productIndex]) return;

    const updatedProducts = [...hour.products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex]!,
      quantity: Math.max(1, quantity),
    };

    const updatedHour: TimelineHour = {
      ...hour,
      products: updatedProducts,
      totals: calculateHourTotals(updatedProducts, hour.waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  updateProductFluid: (hourIndex, productIndex, fluidMl) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour || !hour.products[productIndex]) return;

    const updatedProducts = [...hour.products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex]!,
      fluidMl: Math.max(100, fluidMl), // Minimum 100ml
    };

    const updatedHour: TimelineHour = {
      ...hour,
      products: updatedProducts,
      totals: calculateHourTotals(updatedProducts, hour.waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  updateProductSource: (hourIndex, productIndex, source, locationId, locationName) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour || !hour.products[productIndex]) return;

    const updatedProducts = [...hour.products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex]!,
      source,
      sourceLocationId: locationId ?? null,
      sourceName: locationName ?? null,
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = { ...hour, products: updatedProducts };

    set({ hours: updatedHours });
  },

  moveProduct: (fromHour, fromIndex, toHour) => {
    const { hours } = get();
    const sourceHour = hours[fromHour];
    const destHour = hours[toHour];
    if (!sourceHour || !destHour) return;

    const product = sourceHour.products[fromIndex];
    if (!product) return;

    // Remove from source
    const sourceProducts = sourceHour.products.filter((_, i) => i !== fromIndex);
    const updatedSourceHour: TimelineHour = {
      ...sourceHour,
      products: sourceProducts,
      totals: calculateHourTotals(sourceProducts, sourceHour.waterMl),
    };

    // Add to destination
    const destProducts = [...destHour.products, { ...product, sortOrder: destHour.products.length }];
    const updatedDestHour: TimelineHour = {
      ...destHour,
      products: destProducts,
      totals: calculateHourTotals(destProducts, destHour.waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[fromHour] = updatedSourceHour;
    updatedHours[toHour] = updatedDestHour;

    set({ hours: updatedHours });
  },

  // -------------------------------------------------------------------------
  // Water Management
  // -------------------------------------------------------------------------

  setHourWater: (hourIndex, waterMl, source) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour) return;

    const updatedHour: TimelineHour = {
      ...hour,
      waterMl,
      waterSource: source ?? hour.waterSource,
      totals: calculateHourTotals(hour.products, waterMl),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  clearHour: (hourIndex) => {
    const { hours } = get();
    const hour = hours[hourIndex];
    if (!hour) return;

    const updatedHour: TimelineHour = {
      ...hour,
      products: [],
      waterMl: 0,
      waterSource: null,
      totals: calculateHourTotals([], 0),
    };

    const updatedHours = [...hours];
    updatedHours[hourIndex] = updatedHour;

    set({ hours: updatedHours });
  },

  // -------------------------------------------------------------------------
  // UI State
  // -------------------------------------------------------------------------

  selectHour: (index) => set({ selectedHourIndex: index }),

  setDragging: (isDragging) => set({ isDragging }),

  setFilters: (filters) => {
    const current = get().filters;
    set({ filters: { ...current, ...filters } });
  },

  setFilterCategory: (category, enabled) => {
    const { filters } = get();
    const newCategories = enabled
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category);
    set({ filters: { ...filters, categories: newCategories } });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),

  reset: () => set(initialState),
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get filtered products based on current filter state
 */
export function useFilteredProducts() {
  const products = useNutritionPlannerStore((s) => s.products);
  const filters = useNutritionPlannerStore((s) => s.filters);
  const favoriteIds = useNutritionPlannerStore((s) => s.favoriteProductIds);

  return products.filter((p) => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(p.category)) return false;
    }

    // Caffeine filters
    if (filters.caffeineOnly && !p.caffeineMg) return false;
    if (filters.caffeineeFree && p.caffeineMg) return false;

    // Favorites filter
    if (filters.favoritesOnly && !favoriteIds.includes(p.id)) return false;

    return true;
  });
}

/**
 * Get running totals across all hours
 */
export function useRunningTotals() {
  const hours = useNutritionPlannerStore((s) => s.hours);

  return hours.reduce(
    (acc, h) => ({
      carbs: acc.carbs + h.totals.carbs,
      calories: acc.calories + h.totals.calories,
      sodium: acc.sodium + h.totals.sodium,
      caffeine: acc.caffeine + h.totals.caffeine,
      fluid: acc.fluid + h.totals.fluid,
    }),
    { carbs: 0, calories: 0, sodium: 0, caffeine: 0, fluid: 0 }
  );
}
