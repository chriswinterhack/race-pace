"use client";

import { Loader2, Check } from "lucide-react";
import { Input, Label, Button } from "@/components/ui";
import type { SettingsFormState } from "@/types/settings";

interface NutritionSectionProps {
  formState: SettingsFormState;
  updateFormField: <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => void;
  saving: string | null;
  saveNutrition: () => Promise<void>;
}

export function NutritionSection({
  formState,
  updateFormField,
  saving,
  saveNutrition,
}: NutritionSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Nutrition Preferences
        </h2>
        <p className="text-sm text-brand-navy-500">
          Your hourly fueling targets based on your gut tolerance
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <Label htmlFor="carbs" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Carbs
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="carbs"
                type="number"
                placeholder="90"
                className="font-mono"
                value={formState.carbsPerHour}
                onChange={(e) => updateFormField("carbsPerHour", e.target.value)}
              />
              <span className="text-sm text-brand-navy-500 whitespace-nowrap">
                g/hr
              </span>
            </div>
            <p className="text-xs text-brand-navy-400 mt-2">Typical: 60-120g</p>
          </div>
          <div>
            <Label htmlFor="fluid" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Fluid
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="fluid"
                type="number"
                placeholder="750"
                className="font-mono"
                value={formState.fluidPerHour}
                onChange={(e) => updateFormField("fluidPerHour", e.target.value)}
              />
              <span className="text-sm text-brand-navy-500 whitespace-nowrap">
                ml/hr
              </span>
            </div>
            <p className="text-xs text-brand-navy-400 mt-2">Typical: 500-1000ml</p>
          </div>
          <div>
            <Label htmlFor="sodium" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Sodium
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="sodium"
                type="number"
                placeholder="750"
                className="font-mono"
                value={formState.sodiumPerHour}
                onChange={(e) =>
                  updateFormField("sodiumPerHour", e.target.value)
                }
              />
              <span className="text-sm text-brand-navy-500 whitespace-nowrap">
                mg/hr
              </span>
            </div>
            <p className="text-xs text-brand-navy-400 mt-2">Typical: 500-1500mg</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-brand-sky-50 rounded-lg">
          <p className="text-sm text-brand-sky-800">
            <strong>Tip:</strong> These are your personal defaults based on what
            you can tolerate. They&apos;re used as starting points for
            race-specific nutrition plans, which can be customized per event.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveNutrition} disabled={saving === "nutrition"}>
          {saving === "nutrition" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Nutrition
        </Button>
      </div>
    </div>
  );
}
