"use client";

import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SettingsFormState } from "@/types/settings";

interface PreferencesSectionProps {
  formState: SettingsFormState;
  updateFormField: <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => void;
  saving: string | null;
  savePreferences: () => Promise<void>;
}

export function PreferencesSection({
  formState,
  updateFormField,
  saving,
  savePreferences,
}: PreferencesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">Preferences</h2>
        <p className="text-sm text-brand-navy-500">Customize your experience</p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-brand-navy-900">Units</h3>
            <p className="text-sm text-brand-navy-500 mt-0.5">
              Display distances and weights
            </p>
          </div>
          <select
            className="px-4 py-2 border border-brand-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky-400 bg-white"
            value={formState.preferredUnits}
            onChange={(e) =>
              updateFormField(
                "preferredUnits",
                e.target.value as "metric" | "imperial"
              )
            }
          >
            <option value="imperial">Imperial (mi, lb)</option>
            <option value="metric">Metric (km, kg)</option>
          </select>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-brand-navy-900">Public Profile</h3>
            <p className="text-sm text-brand-navy-500 mt-0.5">
              Allow others to see your profile and gear setups
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formState.publicProfile}
            onClick={() =>
              updateFormField("publicProfile", !formState.publicProfile)
            }
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:ring-offset-2",
              formState.publicProfile ? "bg-brand-sky-500" : "bg-brand-navy-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                formState.publicProfile ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving === "preferences"}>
          {saving === "preferences" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
