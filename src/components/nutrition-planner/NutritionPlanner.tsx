"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ProductPalette } from "./ProductPalette";
import { NutritionTargets, NutritionProgress, NutritionWarnings } from "./NutritionTargets";
import { NutritionTimeline } from "./NutritionTimeline";
import { ProductCard } from "./ProductCard";
import { useNutritionPlannerStore } from "@/stores/nutritionPlannerStore";
import { createClient } from "@/lib/supabase/client";
import type { NutritionProduct, ProductCategory, TimelineHour } from "./types";

interface NutritionPlannerProps {
  racePlanId: string;
  raceDurationHours: number;
  maxElevationFt?: number;
  raceStartTime?: string;
  athleteWeightKg?: number;
  temperatureF?: number;
  humidity?: number;
  className?: string;
}

export function NutritionPlanner({
  racePlanId,
  raceDurationHours,
  maxElevationFt = 5000,
  raceStartTime = "06:00",
  athleteWeightKg = 75,
  temperatureF = 70,
  humidity = 50,
  className,
}: NutritionPlannerProps) {
  const setRaceInfo = useNutritionPlannerStore((s) => s.setRaceInfo);
  const setAthleteInfo = useNutritionPlannerStore((s) => s.setAthleteInfo);
  const setWeather = useNutritionPlannerStore((s) => s.setWeather);
  const setProducts = useNutritionPlannerStore((s) => s.setProducts);
  const setFavorites = useNutritionPlannerStore((s) => s.setFavorites);
  const setLoading = useNutritionPlannerStore((s) => s.setLoading);
  const isLoading = useNutritionPlannerStore((s) => s.isLoading);
  const addProductToHour = useNutritionPlannerStore((s) => s.addProductToHour);
  const setDragging = useNutritionPlannerStore((s) => s.setDragging);
  const hours = useNutritionPlannerStore((s) => s.hours);
  const products = useNutritionPlannerStore((s) => s.products);
  const reset = useNutritionPlannerStore((s) => s.reset);

  // Track nutrition plan ID for saving
  const [nutritionPlanId, setNutritionPlanId] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<NutritionProduct | null>(null);

  // Track if we've loaded initial data
  const hasLoadedRef = useRef(false);
  // Debounce save timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous hours for change detection
  const prevHoursRef = useRef<string>("");

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Initialize with race data
  useEffect(() => {
    setRaceInfo({
      racePlanId,
      raceDurationHours,
      maxElevationFt,
      raceStartTime,
    });
    setAthleteInfo({ weightKg: athleteWeightKg });
    setWeather({ temperatureF, humidity });

    return () => {
      reset();
      hasLoadedRef.current = false;
    };
  }, [
    racePlanId,
    raceDurationHours,
    maxElevationFt,
    raceStartTime,
    athleteWeightKg,
    temperatureF,
    humidity,
    setRaceInfo,
    setAthleteInfo,
    setWeather,
    reset,
  ]);

  // Save to database (debounced)
  const saveToDatabase = useCallback(async (hoursToSave: TimelineHour[], planId: string | null) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let currentPlanId = planId;

      // Create or get the nutrition plan
      if (!currentPlanId) {
        const { data: existingPlan } = await supabase
          .from("race_nutrition_plans")
          .select("id")
          .eq("race_plan_id", racePlanId)
          .single();

        if (existingPlan) {
          currentPlanId = existingPlan.id;
        } else {
          const { data: newPlan, error: planError } = await supabase
            .from("race_nutrition_plans")
            .insert({ race_plan_id: racePlanId })
            .select("id")
            .single();

          if (planError) throw planError;
          currentPlanId = newPlan.id;
        }
        setNutritionPlanId(currentPlanId);
      }

      // Delete existing items for this plan
      await supabase
        .from("race_nutrition_plan_items")
        .delete()
        .eq("nutrition_plan_id", currentPlanId);

      await supabase
        .from("race_nutrition_plan_water")
        .delete()
        .eq("nutrition_plan_id", currentPlanId);

      // Insert new items
      const itemsToInsert = [];
      const waterToInsert = [];

      for (const hour of hoursToSave) {
        // Add products
        for (const item of hour.products) {
          itemsToInsert.push({
            nutrition_plan_id: currentPlanId,
            product_id: item.productId,
            hour_number: hour.hourNumber,
            quantity: item.quantity,
            source: item.source,
            source_location_id: item.sourceLocationId,
            source_name: item.sourceName,
            notes: item.notes,
            sort_order: item.sortOrder,
          });
        }

        // Add water if any
        if (hour.waterMl > 0) {
          waterToInsert.push({
            nutrition_plan_id: currentPlanId,
            hour_number: hour.hourNumber,
            water_ml: hour.waterMl,
            source: hour.waterSource || "on_bike",
          });
        }
      }

      if (itemsToInsert.length > 0) {
        await supabase.from("race_nutrition_plan_items").insert(itemsToInsert);
      }

      if (waterToInsert.length > 0) {
        await supabase.from("race_nutrition_plan_water").insert(waterToInsert);
      }

      console.log("Nutrition plan saved");
    } catch (err) {
      console.error("Error saving nutrition plan:", err);
    }
  }, [racePlanId]);

  // Auto-save when hours change
  useEffect(() => {
    if (!hasLoadedRef.current || products.length === 0) return;

    const hoursJson = JSON.stringify(hours.map(h => ({
      hourNumber: h.hourNumber,
      products: h.products.map(p => ({ productId: p.productId, quantity: p.quantity, source: p.source })),
      waterMl: h.waterMl,
    })));

    // Skip if nothing changed
    if (hoursJson === prevHoursRef.current) return;
    prevHoursRef.current = hoursJson;

    // Debounce save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToDatabase(hours, nutritionPlanId);
    }, 1000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [hours, nutritionPlanId, saveToDatabase, products.length]);

  // Load products and saved plan
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch products
      const { data: productData, error } = await supabase
        .from("nutrition_products")
        .select("*")
        .eq("is_active", true)
        .order("brand")
        .order("name");

      if (error) {
        console.error("Error loading products:", error);
        return;
      }

      const transformedProducts: NutritionProduct[] = (productData || []).map((p) => ({
        id: p.id,
        brand: p.brand,
        name: p.name,
        category: p.category as ProductCategory,
        servingSize: p.serving_size,
        calories: p.calories,
        carbsGrams: Number(p.carbs_grams),
        sodiumMg: p.sodium_mg,
        sugarsGrams: p.sugars_grams ? Number(p.sugars_grams) : null,
        glucoseGrams: p.glucose_grams ? Number(p.glucose_grams) : null,
        fructoseGrams: p.fructose_grams ? Number(p.fructose_grams) : null,
        maltodextrinGrams: p.maltodextrin_grams ? Number(p.maltodextrin_grams) : null,
        glucoseFructoseRatio: p.glucose_fructose_ratio,
        caffeineMg: p.caffeine_mg,
        proteinGrams: p.protein_grams ? Number(p.protein_grams) : null,
        fatGrams: p.fat_grams ? Number(p.fat_grams) : null,
        fiberGrams: p.fiber_grams ? Number(p.fiber_grams) : null,
        waterContentMl: p.water_content_ml,
        imageUrl: p.image_url,
        isVerified: p.is_verified,
        notes: p.notes,
      }));

      setProducts(transformedProducts);

      // Create a lookup map for products
      const productMap = new Map(transformedProducts.map(p => [p.id, p]));

      // Load user favorites
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favorites } = await supabase
          .from("user_favorite_products")
          .select("product_id")
          .eq("user_id", user.id);

        if (favorites) {
          setFavorites(favorites.map((f) => f.product_id));
        }

        // Load existing nutrition plan
        const { data: existingPlan } = await supabase
          .from("race_nutrition_plans")
          .select(`
            id,
            race_nutrition_plan_items (
              product_id,
              hour_number,
              quantity,
              source,
              source_location_id,
              source_name,
              notes,
              sort_order
            ),
            race_nutrition_plan_water (
              hour_number,
              water_ml,
              source
            )
          `)
          .eq("race_plan_id", racePlanId)
          .single();

        if (existingPlan) {
          setNutritionPlanId(existingPlan.id);

          // Wait for timeline to be initialized
          setTimeout(() => {
            const store = useNutritionPlannerStore.getState();

            // Apply saved items to hours
            const items = existingPlan.race_nutrition_plan_items || [];
            const waters = existingPlan.race_nutrition_plan_water || [];

            for (const item of items) {
              const product = productMap.get(item.product_id);
              if (product) {
                const hourIndex = item.hour_number - 1;
                if (hourIndex >= 0 && hourIndex < store.hours.length) {
                  // Add product with saved quantity
                  for (let i = 0; i < item.quantity; i++) {
                    store.addProductToHour(hourIndex, product, item.source as any);
                  }
                  // Update quantity to match (since addProductToHour adds with qty=1)
                  const hour = store.hours[hourIndex];
                  if (hour && hour.products.length > 0) {
                    const lastIdx = hour.products.length - 1;
                    store.updateProductQuantity(hourIndex, lastIdx, item.quantity);
                  }
                }
              }
            }

            // Apply saved water
            for (const water of waters) {
              const hourIndex = water.hour_number - 1;
              if (hourIndex >= 0 && hourIndex < store.hours.length) {
                store.setHourWater(hourIndex, water.water_ml, water.source as any);
              }
            }

            // Mark initial data as loaded
            hasLoadedRef.current = true;
            // Set initial hash to prevent immediate save
            prevHoursRef.current = JSON.stringify(store.hours.map(h => ({
              hourNumber: h.hourNumber,
              products: h.products.map(p => ({ productId: p.productId, quantity: p.quantity, source: p.source })),
              waterMl: h.waterMl,
            })));
          }, 100);
        } else {
          hasLoadedRef.current = true;
        }
      } else {
        hasLoadedRef.current = true;
      }
    } catch (err) {
      console.error("Error loading nutrition data:", err);
      hasLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [setProducts, setFavorites, setLoading, racePlanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === "product") {
      setActiveProduct(data.product);
      setDragging(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);
    setDragging(false);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "product" && overData?.type === "hour") {
      const product = activeData.product as NutritionProduct;
      const hourIndex = overData.hourIndex as number;
      addProductToHour(hourIndex, product);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-gradient-to-br from-brand-navy-50 to-white", className)}>
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-brand-navy-100" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-sky-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-brand-navy-600 font-medium">Loading nutrition products...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex h-full", className)}>
        <div className="w-80 flex-shrink-0 h-full overflow-hidden">
          <ProductPalette className="h-full" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-brand-navy-50/50 to-white">
          <NutritionTargets />
          <NutritionWarnings />
          <NutritionTimeline />
          <NutritionProgress />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProduct && (
          <div className="opacity-95 scale-105 rotate-2">
            <ProductCard
              product={activeProduct}
              isDraggable={false}
              isCompact
              className="shadow-2xl ring-2 ring-brand-sky-400"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
