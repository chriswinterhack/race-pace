"use client";

import { Utensils, Droplets, FlaskConical, Zap, Info } from "lucide-react";
import { Input, Label } from "@/components/ui";
import { usePlanBuilder } from "../context/PlanBuilderContext";
import {
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateRaceNutrition,
  formatDuration,
} from "@/lib/calculations";

export function NutritionPlan() {
  const { state, dispatch } = usePlanBuilder();
  const { nutritionPlan } = state;

  // Calculate energy and nutrition needs
  const adjustedFTP = calculateAltitudeAdjustedFTP(
    state.athlete.ftp,
    state.athlete.altitudeAdjustmentFactor
  );
  const targetNP = calculateTargetNP(adjustedFTP, "tempo");
  const raceTimeHours = state.goalTimeMinutes / 60;

  const nutrition = calculateRaceNutrition(
    targetNP,
    raceTimeHours,
    nutritionPlan.choPerHour,
    nutritionPlan.hydrationMlPerHour,
    nutritionPlan.sodiumMgPerHour
  );

  const updateNutrition = (field: keyof typeof nutritionPlan, value: number) => {
    dispatch({
      type: "SET_NUTRITION",
      nutrition: { [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Nutrition Strategy
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Plan your fueling and hydration for race day
        </p>
      </div>

      {/* Energy Summary */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-brand-sky-50 to-brand-navy-50 border border-brand-sky-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-brand-sky-600" />
          <h3 className="font-medium text-brand-navy-900">Energy Expenditure</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-brand-navy-600">Total Calories</p>
            <p className="text-2xl font-bold text-brand-navy-900">
              {nutrition.totalCalories.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-navy-600">Calories/Hour</p>
            <p className="text-2xl font-bold text-brand-navy-900">
              {Math.round(nutrition.totalCalories / raceTimeHours)}
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-navy-600">Race Duration</p>
            <p className="text-2xl font-bold text-brand-navy-900">
              {formatDuration(state.goalTimeMinutes)}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Targets */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carbohydrates */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-100">
              <Utensils className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-brand-navy-900">Carbohydrates</h3>
              <p className="text-xs text-brand-navy-500">Primary fuel source</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="choPerHour" className="text-sm">
                Target (g/hour)
              </Label>
              <Input
                id="choPerHour"
                type="number"
                value={nutritionPlan.choPerHour}
                onChange={(e) =>
                  updateNutrition("choPerHour", parseInt(e.target.value) || 0)
                }
                min={30}
                max={120}
                className="mt-1"
              />
              <input
                type="range"
                min={30}
                max={120}
                value={nutritionPlan.choPerHour}
                onChange={(e) =>
                  updateNutrition("choPerHour", parseInt(e.target.value))
                }
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-brand-navy-100">
              <div className="flex justify-between text-sm">
                <span className="text-brand-navy-600">Total needed:</span>
                <span className="font-medium text-brand-navy-900">
                  {nutrition.totalCHO}g
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-brand-navy-600">Min requirement:</span>
                <span className="font-medium text-brand-navy-900">
                  {nutrition.minCHOPerHour}g/hr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-brand-navy-900">Hydration</h3>
              <p className="text-xs text-brand-navy-500">Fluid intake</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hydration" className="text-sm">
                Target (ml/hour)
              </Label>
              <Input
                id="hydration"
                type="number"
                value={nutritionPlan.hydrationMlPerHour}
                onChange={(e) =>
                  updateNutrition("hydrationMlPerHour", parseInt(e.target.value) || 0)
                }
                min={300}
                max={1200}
                className="mt-1"
              />
              <input
                type="range"
                min={300}
                max={1200}
                step={50}
                value={nutritionPlan.hydrationMlPerHour}
                onChange={(e) =>
                  updateNutrition("hydrationMlPerHour", parseInt(e.target.value))
                }
                className="w-full mt-2 accent-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-brand-navy-100">
              <div className="flex justify-between text-sm">
                <span className="text-brand-navy-600">Total needed:</span>
                <span className="font-medium text-brand-navy-900">
                  {(nutrition.totalHydration / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-brand-navy-600">~bottles/hr:</span>
                <span className="font-medium text-brand-navy-900">
                  {(nutritionPlan.hydrationMlPerHour / 500).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sodium */}
        <div className="p-4 rounded-lg border border-brand-navy-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <FlaskConical className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-brand-navy-900">Sodium</h3>
              <p className="text-xs text-brand-navy-500">Electrolyte balance</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sodium" className="text-sm">
                Target (mg/hour)
              </Label>
              <Input
                id="sodium"
                type="number"
                value={nutritionPlan.sodiumMgPerHour}
                onChange={(e) =>
                  updateNutrition("sodiumMgPerHour", parseInt(e.target.value) || 0)
                }
                min={300}
                max={1500}
                className="mt-1"
              />
              <input
                type="range"
                min={300}
                max={1500}
                step={50}
                value={nutritionPlan.sodiumMgPerHour}
                onChange={(e) =>
                  updateNutrition("sodiumMgPerHour", parseInt(e.target.value))
                }
                className="w-full mt-2 accent-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-brand-navy-100">
              <div className="flex justify-between text-sm">
                <span className="text-brand-navy-600">Total needed:</span>
                <span className="font-medium text-brand-navy-900">
                  {(nutrition.totalSodium / 1000).toFixed(1)}g
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-brand-navy-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-brand-navy-600">
            <p className="font-medium text-brand-navy-700 mb-1">Nutrition Tips</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Train your gut to handle these intake rates before race day</li>
              <li>Aim to replace 20-30% of calories burned from carbs</li>
              <li>Increase sodium in hot conditions (+200-400mg/hr)</li>
              <li>Front-load calories early when you&apos;re feeling fresh</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
