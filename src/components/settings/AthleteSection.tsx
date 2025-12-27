"use client";

import { Lock, Loader2, Check, Mountain, Minus } from "lucide-react";
import { Input, Label, Button } from "@/components/ui";
import type { SettingsFormState } from "@/types/settings";

interface PowerTargets {
  baseFtp: number;
  adjustedFtp: number;
  adjustedNP: { safe: number; tempo: number; pushing: number };
  climbingPower: { safe: number; tempo: number; pushing: number };
  flatPower: { safe: number; tempo: number; pushing: number };
}

interface AthleteSectionProps {
  formState: SettingsFormState;
  updateFormField: <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => void;
  saving: string | null;
  isLocked: boolean;
  powerTargets: PowerTargets | null;
  getDisplayWeight: () => string;
  handleWeightChange: (value: string) => void;
  getDisplayGearWeight: () => string;
  handleGearWeightChange: (value: string) => void;
  savePowerSettings: () => Promise<void>;
}

export function AthleteSection({
  formState,
  updateFormField,
  saving,
  isLocked,
  powerTargets,
  getDisplayWeight,
  handleWeightChange,
  getDisplayGearWeight,
  handleGearWeightChange,
  savePowerSettings,
}: AthleteSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy-900">
            Athlete Profile
          </h2>
          <p className="text-sm text-brand-navy-500">
            Your fitness metrics and power zones
          </p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-sm font-medium">
            <Lock className="h-3.5 w-3.5" />
            Locked by Coach
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
        {/* Base Metrics */}
        <div className="p-6">
          <h3 className="font-medium text-brand-navy-900 mb-4">Base Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ftp">FTP (watts)</Label>
              <Input
                id="ftp"
                type="number"
                placeholder="250"
                className="mt-2 font-mono"
                value={formState.ftp}
                onChange={(e) => updateFormField("ftp", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight">
                Body Weight (
                {formState.preferredUnits === "imperial" ? "lbs" : "kg"})
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={formState.preferredUnits === "imperial" ? "154" : "70"}
                className="mt-2 font-mono"
                value={getDisplayWeight()}
                onChange={(e) => handleWeightChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gear-weight">
                Gear Weight (
                {formState.preferredUnits === "imperial" ? "lbs" : "kg"})
              </Label>
              <Input
                id="gear-weight"
                type="number"
                step="0.1"
                placeholder={formState.preferredUnits === "imperial" ? "26" : "12"}
                className="mt-2 font-mono"
                value={getDisplayGearWeight()}
                onChange={(e) => handleGearWeightChange(e.target.value)}
              />
              <p className="text-xs text-brand-navy-400 mt-1">
                Bike + hydration + gear
              </p>
            </div>
            <div>
              <Label htmlFor="altitude">Altitude Adjustment (%)</Label>
              <Input
                id="altitude"
                type="number"
                step="1"
                min="0"
                max="50"
                placeholder="20"
                className="mt-2 font-mono"
                value={formState.altitudeAdjustment}
                onChange={(e) =>
                  updateFormField("altitudeAdjustment", e.target.value)
                }
                disabled={isLocked}
              />
              <p className="text-xs text-brand-navy-400 mt-1">
                For races above 4,000 ft
              </p>
            </div>
          </div>
        </div>

        {/* Intensity Factors */}
        <div className="p-6">
          <h3 className="font-medium text-brand-navy-900 mb-1">
            Intensity Factors
          </h3>
          <p className="text-sm text-brand-navy-500 mb-4">
            Your target power as a percentage of FTP for each effort level
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="if-safe" className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Safe
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="if-safe"
                  type="number"
                  min="50"
                  max="80"
                  className="font-mono"
                  value={formState.ifSafe}
                  onChange={(e) => updateFormField("ifSafe", e.target.value)}
                  disabled={isLocked}
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="if-tempo" className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Tempo
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="if-tempo"
                  type="number"
                  min="55"
                  max="85"
                  className="font-mono"
                  value={formState.ifTempo}
                  onChange={(e) => updateFormField("ifTempo", e.target.value)}
                  disabled={isLocked}
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="if-pushing" className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Pushing
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="if-pushing"
                  type="number"
                  min="60"
                  max="90"
                  className="font-mono"
                  value={formState.ifPushing}
                  onChange={(e) => updateFormField("ifPushing", e.target.value)}
                  disabled={isLocked}
                />
                <span className="text-sm text-brand-navy-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Power Targets */}
        {powerTargets && (
          <div className="p-6 bg-brand-navy-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-brand-navy-900">
                Calculated Power Targets
              </h3>
              {formState.weight && (
                <div className="text-sm">
                  <span className="text-brand-navy-500">W/kg:</span>
                  <span className="ml-2 font-mono font-semibold text-brand-navy-900">
                    {(
                      powerTargets.baseFtp / parseFloat(formState.weight)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Target NP Row */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="text-brand-navy-600 font-medium">Target NP</div>
                <div className="text-center">
                  <div className="font-mono font-bold text-emerald-700 bg-emerald-50 rounded-lg py-2">
                    {powerTargets.adjustedNP.safe}w
                  </div>
                  <div className="text-xs text-brand-navy-400 mt-1">Safe</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-amber-700 bg-amber-50 rounded-lg py-2">
                    {powerTargets.adjustedNP.tempo}w
                  </div>
                  <div className="text-xs text-brand-navy-400 mt-1">Tempo</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-red-700 bg-red-50 rounded-lg py-2">
                    {powerTargets.adjustedNP.pushing}w
                  </div>
                  <div className="text-xs text-brand-navy-400 mt-1">Pushing</div>
                </div>
              </div>

              {/* Climbing Row */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="text-brand-navy-600 flex items-center gap-1.5">
                  <Mountain className="h-4 w-4 text-brand-navy-400" />
                  Climbing (+20%)
                </div>
                <div className="text-center font-mono text-emerald-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.climbingPower.safe}w
                </div>
                <div className="text-center font-mono text-amber-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.climbingPower.tempo}w
                </div>
                <div className="text-center font-mono text-red-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.climbingPower.pushing}w
                </div>
              </div>

              {/* Flats Row */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="text-brand-navy-600 flex items-center gap-1.5">
                  <Minus className="h-4 w-4 text-brand-navy-400" />
                  Flats (-10%)
                </div>
                <div className="text-center font-mono text-emerald-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.flatPower.safe}w
                </div>
                <div className="text-center font-mono text-amber-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.flatPower.tempo}w
                </div>
                <div className="text-center font-mono text-red-700 bg-white rounded-lg py-2 border border-brand-navy-100">
                  {powerTargets.flatPower.pushing}w
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={savePowerSettings}
          disabled={saving === "power" || isLocked}
        >
          {saving === "power" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Athlete Profile
        </Button>
      </div>
    </div>
  );
}
