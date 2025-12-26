"use client";

import {
  Lock,
  Zap,
  Droplets,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Heart,
  Search,
  Apple,
  Coffee,
  Candy,
  Pill,
  GlassWater,
  Cookie,
  ChevronRight,
  Target,
  FlameKindling,
} from "lucide-react";
import { Button } from "@/components/ui";
import { calculateRaceNutritionPlan } from "@/lib/calculations/nutritionScience";
import { usePremiumFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface NutritionPreviewProps {
  raceDurationHours: number;
  maxElevationFt: number;
  athleteWeightKg: number;
}

// Sample products that look like real products
const SAMPLE_PRODUCTS = [
  { name: "Maurten Gel 100", carbs: 25, sodium: 35, category: "gel", hasOptimalMix: true, color: "amber" },
  { name: "SIS Beta Fuel", carbs: 80, sodium: 500, category: "drink", hasOptimalMix: true, color: "blue" },
  { name: "Clif Bloks", carbs: 24, sodium: 50, category: "chews", hasOptimalMix: false, color: "orange" },
  { name: "Skratch Chews", carbs: 21, sodium: 80, category: "chews", hasOptimalMix: true, color: "green" },
  { name: "Maurten 320", carbs: 80, sodium: 220, category: "drink", hasOptimalMix: true, color: "amber" },
  { name: "Precision Fuel 30", carbs: 30, sodium: 0, category: "gel", hasOptimalMix: true, color: "red" },
  { name: "Tailwind", carbs: 25, sodium: 310, category: "drink", hasOptimalMix: false, color: "teal" },
  { name: "Nuun Endurance", carbs: 15, sodium: 380, category: "drink", hasOptimalMix: false, color: "pink" },
];

const CATEGORY_ICONS: Record<string, typeof Apple> = {
  gel: Candy,
  drink: GlassWater,
  chews: Cookie,
  bar: Cookie,
  caffeine: Coffee,
  supplement: Pill,
};

const CATEGORY_COLORS: Record<string, string> = {
  gel: "from-amber-500 to-orange-500",
  drink: "from-blue-500 to-cyan-500",
  chews: "from-green-500 to-emerald-500",
  bar: "from-orange-500 to-red-500",
  caffeine: "from-purple-500 to-pink-500",
  supplement: "from-gray-500 to-slate-500",
};

export function NutritionPreview({
  raceDurationHours,
  maxElevationFt,
  athleteWeightKg,
}: NutritionPreviewProps) {
  const { showUpgrade } = usePremiumFeature("Nutrition Planning");

  // Calculate their actual personalized targets
  const plan = calculateRaceNutritionPlan({
    raceDurationHours,
    elevationGainFt: 5000,
    maxElevationFt,
    temperatureF: 70,
    humidity: 50,
    athleteWeightKg,
    gutTrainingLevel: "intermediate",
    sweatRate: "average",
  });

  const { hourlyTargets, warnings, recommendations } = plan;
  const hours = Math.ceil(raceDurationHours);

  // Generate sample timeline data
  const sampleTimeline = Array.from({ length: Math.min(hours, 6) }).map((_, i) => ({
    hour: i + 1,
    time: `${6 + i}:00`,
    products: SAMPLE_PRODUCTS.slice((i * 2) % 6, ((i * 2) % 6) + 2),
    carbs: 75 + (i % 3) * 10,
    fluid: 500 + (i % 2) * 200,
    sodium: 400 + (i % 3) * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">
          Nutrition Plan
        </h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Your personalized fueling strategy for race day
        </p>
      </div>

      {/* Personalized Targets - UNLOCKED - Real Value */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-brand-navy-900">Your Personalized Targets</span>
          <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            Science-based
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-white border border-emerald-100">
            <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-brand-navy-900">{hourlyTargets.carbsGramsTarget}g</p>
            <p className="text-xs text-brand-navy-500">Carbs/hr</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border border-emerald-100">
            <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-brand-navy-900">{hourlyTargets.fluidMlTarget}ml</p>
            <p className="text-xs text-brand-navy-500">Fluid/hr</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border border-emerald-100">
            <FlameKindling className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-brand-navy-900">{hourlyTargets.sodiumMgTarget}mg</p>
            <p className="text-xs text-brand-navy-500">Sodium/hr</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border border-emerald-100">
            <Target className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-brand-navy-900">{hourlyTargets.caloriesTarget}</p>
            <p className="text-xs text-brand-navy-500">Cal/hr</p>
          </div>
        </div>

        {/* Warnings/Recs */}
        {(warnings.length > 0 || recommendations.length > 0) && (
          <div className="mt-4 space-y-2">
            {warnings.slice(0, 1).map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                {warning}
              </div>
            ))}
            {recommendations.slice(0, 1).map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50/50 rounded-lg p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOCKED: Full Builder Preview */}
      <div className="relative rounded-2xl border-2 border-brand-navy-200 overflow-hidden bg-brand-navy-950">
        {/* Actual UI Preview - Shows the real layout */}
        <div className="flex h-[500px]">
          {/* Left Sidebar - Product Palette */}
          <div className="w-72 bg-brand-navy-900 border-r border-brand-navy-800 flex flex-col">
            {/* Search Header */}
            <div className="p-4 border-b border-brand-navy-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-500" />
                <div className="w-full h-10 pl-10 pr-4 rounded-lg bg-brand-navy-800 border border-brand-navy-700 flex items-center">
                  <span className="text-brand-navy-500 text-sm">Search 500+ products...</span>
                </div>
              </div>
              {/* Category Pills */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {["All", "Gels", "Drinks", "Chews"].map((cat, i) => (
                  <span
                    key={cat}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      i === 0
                        ? "bg-brand-sky-500 text-white"
                        : "bg-brand-navy-800 text-brand-navy-400"
                    )}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {SAMPLE_PRODUCTS.map((product, i) => {
                const Icon = CATEGORY_ICONS[product.category] || Apple;
                const colorClass = CATEGORY_COLORS[product.category] || "from-gray-500 to-slate-500";
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-brand-navy-800/50 border border-brand-navy-700 hover:border-brand-navy-600 transition-colors cursor-grab"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-amber-400 font-medium">{product.carbs}g carbs</span>
                          {product.sodium > 0 && (
                            <span className="text-xs text-brand-navy-400">{product.sodium}mg Na</span>
                          )}
                        </div>
                        {product.hasOptimalMix && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                            <Sparkles className="h-2.5 w-2.5" />
                            Optimal Mix
                          </span>
                        )}
                      </div>
                      <Heart className="h-4 w-4 text-brand-navy-600 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content - Timeline */}
          <div className="flex-1 bg-gradient-to-br from-brand-navy-50 to-white p-5 overflow-y-auto">
            {/* Mini Targets Bar */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white border border-brand-navy-100 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-brand-navy-600"><span className="font-semibold text-brand-navy-900">450g</span> / {hourlyTargets.carbsGramsTarget * hours}g carbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-brand-navy-600"><span className="font-semibold text-brand-navy-900">3.5L</span> / {(hourlyTargets.fluidMlTarget * hours / 1000).toFixed(1)}L fluid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-xs text-brand-navy-600"><span className="font-semibold text-brand-navy-900">2,400mg</span> / {hourlyTargets.sodiumMgTarget * hours}mg sodium</span>
                </div>
              </div>
              <div className="text-xs text-emerald-600 font-medium">75% Complete</div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {sampleTimeline.map((hour) => (
                <div
                  key={hour.hour}
                  className="p-4 rounded-xl bg-white border border-brand-navy-100 shadow-sm hover:shadow-md hover:border-brand-sky-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Hour Badge */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {hour.hour}
                      </div>
                      <p className="text-xs text-brand-navy-500 mt-1">{hour.time}</p>
                    </div>

                    {/* Products */}
                    <div className="flex-1 flex flex-wrap gap-2">
                      {hour.products.map((product, j) => {
                        const Icon = CATEGORY_ICONS[product.category] || Apple;
                        return (
                          <div
                            key={j}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                          >
                            <Icon className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-brand-navy-800">{product.name}</span>
                            <span className="text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{product.carbs}g</span>
                          </div>
                        );
                      })}
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-brand-navy-800">Water</span>
                        <span className="text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">{hour.fluid}ml</span>
                      </div>
                    </div>

                    {/* Hour Totals */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-brand-navy-900">{hour.carbs}g</p>
                      <p className="text-xs text-brand-navy-500">{hour.sodium}mg Na</p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-brand-navy-300" />
                  </div>
                </div>
              ))}

              {hours > 6 && (
                <div className="text-center py-4 text-sm text-brand-navy-500">
                  + {hours - 6} more hours in your {hours}-hour race...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Glass Overlay with CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/70 flex items-center justify-center">
          <div className="text-center px-6 max-w-lg">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-sky-500 to-emerald-500 flex items-center justify-center mb-5 shadow-xl shadow-brand-sky-500/30">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-brand-navy-900 mb-3">
              Build Your Perfect Fuel Plan
            </h3>
            <p className="text-brand-navy-600 mb-6 text-lg">
              Drag and drop from 500+ nutrition products to create your hour-by-hour race fueling strategy.
            </p>

            <div className="grid grid-cols-2 gap-3 text-left mb-6 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Drag & drop builder</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">500+ products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">G:F ratio tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Auto-save & sync</span>
              </div>
            </div>

            <Button
              onClick={showUpgrade}
              size="lg"
              className="bg-gradient-to-r from-brand-sky-500 to-emerald-500 hover:from-brand-sky-600 hover:to-emerald-600 text-white shadow-lg shadow-brand-sky-500/25 gap-2 text-base px-8"
            >
              Unlock Nutrition Planning
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-brand-navy-500">
              Included with FinalClimb Premium • $29/year
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
