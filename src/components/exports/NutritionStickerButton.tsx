"use client";

import { useState } from "react";
import { Utensils, Download, Loader2, Maximize, Minimize, Square } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { NutritionStickerPDF, type NutritionHourData } from "./NutritionStickerPDF";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface NutritionStickerButtonProps {
  racePlanId: string;
  raceName: string;
  raceDate?: string;
  goalTimeMinutes: number;
  startTime: string;
  className?: string;
}

type StickerSize = "standard" | "compact" | "extended";

const SIZE_OPTIONS: { value: StickerSize; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "compact", label: "Compact", description: '2" × 7"', icon: <Minimize className="h-4 w-4" /> },
  { value: "standard", label: "Standard", description: '2.25" × 9"', icon: <Square className="h-4 w-4" /> },
  { value: "extended", label: "Extended", description: '2.5" × 11"', icon: <Maximize className="h-4 w-4" /> },
];

function calculateClockTime(startTime: string, hourIndex: number): string {
  const parts = startTime.split(":").map(Number);
  const startHour = parts[0] ?? 6;
  const startMinute = parts[1] ?? 0;
  const totalMinutes = startHour * 60 + startMinute + hourIndex * 60;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.round(totalMinutes % 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function NutritionStickerButton({
  racePlanId,
  raceName,
  raceDate,
  goalTimeMinutes,
  startTime,
  className,
}: NutritionStickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<StickerSize>("standard");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionHourData[] | null>(null);
  const [hasNutritionPlan, setHasNutritionPlan] = useState(false);

  const totalHours = Math.ceil(goalTimeMinutes / 60);

  const loadNutritionData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // First, load all nutrition products to create a lookup map
      const { data: allProducts } = await supabase
        .from("nutrition_products")
        .select("id, brand, name, carbs_grams, sodium_mg, caffeine_mg")
        .eq("is_active", true);

      const productMap = new Map(
        (allProducts || []).map((p) => [p.id, p])
      );

      // Fetch nutrition plan with items (without nested product join)
      const { data: plan } = await supabase
        .from("race_nutrition_plans")
        .select(`
          id,
          race_nutrition_plan_items (
            product_id,
            hour_number,
            quantity
          ),
          race_nutrition_plan_water (
            hour_number,
            water_ml
          )
        `)
        .eq("race_plan_id", racePlanId)
        .single();

      if (!plan) {
        setHasNutritionPlan(false);
        setLoading(false);
        return;
      }

      setHasNutritionPlan(true);

      // Build hour data
      const hours: NutritionHourData[] = [];

      for (let i = 0; i < totalHours; i++) {
        const hourNumber = i + 1;
        const hourItems = (plan.race_nutrition_plan_items || []).filter(
          (item: { hour_number: number }) => item.hour_number === hourNumber
        );
        const hourWater = (plan.race_nutrition_plan_water || []).find(
          (w: { hour_number: number }) => w.hour_number === hourNumber
        );

        const products = hourItems.map((item: {
          product_id: string;
          quantity: number;
        }) => {
          const product = productMap.get(item.product_id);
          return {
            name: product?.name || "Unknown",
            brand: product?.brand || "",
            quantity: item.quantity || 1,
            carbs: Number(product?.carbs_grams || 0) * (item.quantity || 1),
            caffeine: (product?.caffeine_mg || 0) * (item.quantity || 1),
          };
        });

        const totals = {
          carbs: products.reduce((sum, p) => sum + p.carbs, 0),
          sodium: hourItems.reduce((sum, item: { product_id: string; quantity: number }) => {
            const product = productMap.get(item.product_id);
            return sum + (product?.sodium_mg || 0) * (item.quantity || 1);
          }, 0),
          fluid: (hourWater?.water_ml || 0),
          caffeine: products.reduce((sum, p) => sum + (p.caffeine || 0), 0),
        };

        hours.push({
          hourNumber,
          elapsedTime: `${i}:00`,
          clockTime: calculateClockTime(startTime, i),
          products,
          waterMl: hourWater?.water_ml || 0,
          totals,
        });
      }

      setNutritionData(hours);
    } catch (err) {
      console.error("Error loading nutrition data:", err);
      setHasNutritionPlan(false);
    }
    setLoading(false);
  };

  const handleOpen = async () => {
    setIsOpen(true);
    await loadNutritionData();
  };

  const handleGenerate = async () => {
    if (!nutritionData) return;

    setGenerating(true);

    try {
      const doc = (
        <NutritionStickerPDF
          raceName={raceName}
          raceDate={raceDate}
          totalHours={totalHours}
          hours={nutritionData}
          size={size}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${raceName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-nutrition-sticker.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate nutrition sticker:", error);
    }

    setGenerating(false);
  };

  // Count products per hour for preview
  const getProductSummary = () => {
    if (!nutritionData) return null;
    const totalProducts = nutritionData.reduce((sum, h) => sum + h.products.length, 0);
    const hoursWithProducts = nutritionData.filter(h => h.products.length > 0).length;
    return { totalProducts, hoursWithProducts };
  };

  const summary = getProductSummary();

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpen}
        className={cn("gap-2", className)}
        disabled={!goalTimeMinutes}
      >
        <Utensils className="h-4 w-4" />
        Nutrition Sticker
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-brand-sky-500" />
              Generate Nutrition Sticker
            </DialogTitle>
            <DialogDescription>
              Create a sticker showing what to eat each hour of your race.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-sky-500" />
              <span className="ml-2 text-brand-navy-600">Loading nutrition plan...</span>
            </div>
          ) : !hasNutritionPlan ? (
            <div className="py-8 text-center">
              <Utensils className="h-12 w-12 text-brand-navy-300 mx-auto mb-3" />
              <p className="text-brand-navy-600 font-medium">No nutrition plan found</p>
              <p className="text-sm text-brand-navy-500 mt-1">
                Add products to your nutrition timeline first
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Summary */}
              <div className="p-4 bg-brand-navy-50 rounded-xl space-y-2">
                <h4 className="font-semibold text-brand-navy-900">{raceName}</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-brand-navy-500">
                    {totalHours} hours
                  </span>
                  {summary && (
                    <>
                      <span className="text-brand-navy-500">
                        {summary.totalProducts} products
                      </span>
                      <span className="text-brand-navy-500">
                        {summary.hoursWithProducts}/{totalHours} hrs planned
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Preview of products per hour */}
              {nutritionData && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-brand-navy-200">
                  {nutritionData.slice(0, 5).map((hour) => (
                    <div
                      key={hour.hourNumber}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2 text-sm",
                        hour.hourNumber % 2 === 0 ? "bg-brand-navy-50" : "bg-white"
                      )}
                    >
                      <span className="font-bold text-brand-sky-600 w-6">
                        H{hour.hourNumber}
                      </span>
                      <div className="flex-1 text-brand-navy-700">
                        {hour.products.length === 0 ? (
                          <span className="text-brand-navy-400 italic">Rest / water only</span>
                        ) : (
                          hour.products.map((p, i) => (
                            <span key={i}>
                              {i > 0 && ", "}
                              {p.quantity > 1 && `${p.quantity}x `}
                              {p.brand} {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                  {nutritionData.length > 5 && (
                    <div className="px-3 py-2 text-xs text-brand-navy-500 bg-brand-navy-50">
                      +{nutritionData.length - 5} more hours...
                    </div>
                  )}
                </div>
              )}

              {/* Size Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-brand-navy-700">Sticker Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSize(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                        size === option.value
                          ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                          : "border-brand-navy-200 hover:border-brand-navy-300 text-brand-navy-600"
                      )}
                    >
                      {option.icon}
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs opacity-70">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-brand-navy-500">
                Print at 100% scale. Apply next to your pacing sticker for quick reference.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || loading || !hasNutritionPlan}
              className="flex-1 gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
