"use client";

import {
  Zap,
  Mountain,
  Minus,
  Info,
  ArrowRight,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui";
import { usePremiumFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface PowerTargetsPreviewProps {
  ftpWatts?: number;
  weightKg?: number;
  maxElevationFt?: number;
  goalTimeMinutes?: number;
  distanceMiles?: number;
}

// Sample data that looks realistic
const SAMPLE_DATA = {
  ftp: 280,
  weightKg: 75,
  wPerKg: 3.73,
  altitudeAdjustment: 20,
  adjustedFtp: 224,
  pacingTotal: "10h 45m",
  goalNp: 165,
  raceType: "Gravel",
  realWorldFactor: 94,
  avgSpeed: "9.2 mph",
  fatigueFactor: 97,
  seaLevelNP: { safe: 188, tempo: 196, pushing: 204 },
  raceNP: { safe: 150, tempo: 157, pushing: 163 },
  climbingNP: { safe: 180, tempo: 188, pushing: 196 },
  flatNP: { safe: 135, tempo: 141, pushing: 147 },
  courseProfile: { climbing: 35, flat: 40, descent: 25 },
  timeByTerrain: { climbing: "4h 12m", flat: "3h 48m", descent: "2h 45m" },
  surfaceMix: { gravel: 65, pavement: 25, singletrack: 10 },
};

export function PowerTargetsPreview({
  ftpWatts,
  weightKg,
  maxElevationFt = 8000,
}: PowerTargetsPreviewProps) {
  const { showUpgrade } = usePremiumFeature("Power Targets");

  // Use real FTP if available, otherwise sample
  const displayFtp = ftpWatts || SAMPLE_DATA.ftp;
  const displayWeight = weightKg || SAMPLE_DATA.weightKg;
  const wPerKg = displayWeight ? (displayFtp / displayWeight).toFixed(2) : SAMPLE_DATA.wPerKg;
  const needsAltitudeAdjustment = maxElevationFt > 4000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Power Targets</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            {needsAltitudeAdjustment
              ? `NP zones adjusted for altitude (${maxElevationFt.toLocaleString()} ft)`
              : "Normalized Power (NP) zones for this course"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy-100 rounded-lg text-brand-navy-400 text-sm font-medium cursor-not-allowed">
          <Pencil className="h-3.5 w-3.5" />
          Edit IF & AA%
        </div>
      </div>

      {/* Preview Container */}
      <div className="relative rounded-2xl border-2 border-brand-navy-200 overflow-hidden bg-white">
        <div className="p-6 space-y-6">
          {/* FTP Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-4 rounded-lg bg-brand-navy-50">
              <p className="text-sm text-brand-navy-600">Your FTP</p>
              <p className="text-2xl font-bold text-brand-navy-900 font-mono">
                {displayFtp}w
              </p>
              <p className="text-xs text-brand-navy-500 mt-1">
                {wPerKg} W/kg
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-lg",
              needsAltitudeAdjustment ? "bg-brand-sky-50" : "bg-emerald-50"
            )}>
              <p className="text-sm text-brand-navy-600">
                {needsAltitudeAdjustment ? "AA FTP" : "Race FTP"}
              </p>
              <p className="text-2xl font-bold text-brand-navy-900 font-mono">
                {SAMPLE_DATA.adjustedFtp}w
              </p>
              {needsAltitudeAdjustment ? (
                <p className="text-xs text-brand-navy-500 mt-1">
                  AA: -{SAMPLE_DATA.altitudeAdjustment}%
                </p>
              ) : (
                <p className="text-xs text-emerald-600 mt-1">
                  No AA needed
                </p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-amber-50">
              <p className="text-sm text-brand-navy-600">Pacing Total</p>
              <p className="text-2xl font-bold text-amber-700 font-mono">
                {SAMPLE_DATA.pacingTotal}
              </p>
              <p className="text-xs text-brand-navy-500 mt-1">
                From segment plan
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50">
              <p className="text-sm text-brand-navy-600">Goal NP</p>
              <p className="text-2xl font-bold text-emerald-700 font-mono">
                {SAMPLE_DATA.goalNp}w
              </p>
              <p className="text-xs text-brand-navy-500 mt-1">
                Within Tempo zone
              </p>
            </div>
          </div>

          {/* Physics-Based Time Breakdown */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-brand-navy-50 to-brand-sky-50 border border-brand-navy-100">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-brand-sky-600" />
              <h4 className="text-sm font-medium text-brand-navy-900">
                Physics-Based Time Breakdown
              </h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Surface Mix */}
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Surface Mix</p>
                <div className="text-xs font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-amber-600">Gravel:</span>
                    <span>{SAMPLE_DATA.surfaceMix.gravel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-navy-600">Pavement:</span>
                    <span>{SAMPLE_DATA.surfaceMix.pavement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Singletrack:</span>
                    <span>{SAMPLE_DATA.surfaceMix.singletrack}%</span>
                  </div>
                </div>
                <p className="text-xs text-brand-navy-400 mt-1">Crr: 0.0095</p>
              </div>
              {/* Course Profile */}
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Course Profile</p>
                <div className="flex gap-1 text-xs font-mono">
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                    ↑{SAMPLE_DATA.courseProfile.climbing}%
                  </span>
                  <span className="px-1.5 py-0.5 bg-brand-navy-100 text-brand-navy-700 rounded">
                    →{SAMPLE_DATA.courseProfile.flat}%
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                    ↓{SAMPLE_DATA.courseProfile.descent}%
                  </span>
                </div>
              </div>
              {/* Time by Terrain */}
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Time by Terrain</p>
                <div className="text-xs font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-red-600">Climbing:</span>
                    <span>{SAMPLE_DATA.timeByTerrain.climbing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-navy-600">Flat:</span>
                    <span>{SAMPLE_DATA.timeByTerrain.flat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Descent:</span>
                    <span>{SAMPLE_DATA.timeByTerrain.descent}</span>
                  </div>
                </div>
              </div>
              {/* Fatigue Factor */}
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Fatigue Factor</p>
                <p className="text-lg font-bold font-mono text-emerald-600">
                  {SAMPLE_DATA.fatigueFactor}%
                </p>
                <p className="text-xs text-brand-navy-400">Minimal fatigue</p>
              </div>
              {/* Avg Speed */}
              <div>
                <p className="text-xs text-brand-navy-500 mb-1">Avg Speed</p>
                <p className="text-lg font-bold font-mono text-brand-navy-900">
                  {SAMPLE_DATA.avgSpeed}
                </p>
                <p className="text-xs text-brand-navy-400">14.8 km/h</p>
              </div>
            </div>

            {/* Race Type Row */}
            <div className="mt-4 pt-3 border-t border-brand-navy-100 flex items-center gap-4">
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Race Type</p>
                <p className="text-sm font-medium text-brand-navy-900">{SAMPLE_DATA.raceType}</p>
              </div>
              <div className="h-8 w-px bg-brand-navy-200" />
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Real-World Factor</p>
                <p className="text-sm font-bold font-mono text-amber-600">{SAMPLE_DATA.realWorldFactor}%</p>
              </div>
              <div className="h-8 w-px bg-brand-navy-200" />
              <div>
                <p className="text-xs text-brand-navy-500 mb-0.5">Adjusted NP</p>
                <p className="text-sm font-bold font-mono text-brand-sky-600">{SAMPLE_DATA.goalNp}w</p>
              </div>
            </div>
          </div>

          {/* Target NP Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-navy-100">
                  <th className="text-left py-2 pr-4 font-medium text-brand-navy-600">Target NP</th>
                  <th className="text-center py-2 px-4 font-medium text-emerald-700">
                    <div>Safe</div>
                    <div className="text-xs font-normal">IF 67%</div>
                  </th>
                  <th className="text-center py-2 px-4 font-medium text-amber-700">
                    <div>Tempo</div>
                    <div className="text-xs font-normal">IF 70%</div>
                  </th>
                  <th className="text-center py-2 px-4 font-medium text-red-700">
                    <div>Pushing</div>
                    <div className="text-xs font-normal">IF 73%</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-navy-50">
                  <td className="py-3 pr-4 text-brand-navy-700">Sea Level NP</td>
                  <td className="py-3 px-4 text-center font-mono">{SAMPLE_DATA.seaLevelNP.safe}w</td>
                  <td className="py-3 px-4 text-center font-mono">{SAMPLE_DATA.seaLevelNP.tempo}w</td>
                  <td className="py-3 px-4 text-center font-mono">{SAMPLE_DATA.seaLevelNP.pushing}w</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-brand-navy-700">
                    Race NP <span className="text-brand-navy-400 ml-1">(AA -{SAMPLE_DATA.altitudeAdjustment}%)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{SAMPLE_DATA.raceNP.safe}w</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">{SAMPLE_DATA.raceNP.tempo}w</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-700">{SAMPLE_DATA.raceNP.pushing}w</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terrain Pacing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-navy-100">
                  <th className="text-left py-2 pr-4 font-medium text-brand-navy-600">Terrain NP</th>
                  <th className="text-center py-2 px-4 font-medium text-emerald-700">Safe NP</th>
                  <th className="text-center py-2 px-4 font-medium text-amber-700">Tempo NP</th>
                  <th className="text-center py-2 px-4 font-medium text-red-700">Pushing NP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-navy-50">
                  <td className="py-3 pr-4 text-brand-navy-700 flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-brand-navy-400" />
                    Climbing <span className="text-brand-navy-400">(+20% NP)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-emerald-100 text-emerald-800">
                      {SAMPLE_DATA.climbingNP.safe}w
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-amber-100 text-amber-800">
                      {SAMPLE_DATA.climbingNP.tempo}w
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-red-100 text-red-800">
                      {SAMPLE_DATA.climbingNP.pushing}w
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-brand-navy-700 flex items-center gap-2">
                    <Minus className="h-4 w-4 text-brand-navy-400" />
                    Flat/Rolling <span className="text-brand-navy-400">(-10% NP)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-emerald-100 text-emerald-800">
                      {SAMPLE_DATA.flatNP.safe}w
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-amber-100 text-amber-800">
                      {SAMPLE_DATA.flatNP.tempo}w
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg font-mono font-bold bg-red-100 text-red-800">
                      {SAMPLE_DATA.flatNP.pushing}w
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Glass Overlay with CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/60 flex items-center justify-center">
          <div className="text-center px-6 max-w-lg">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-sky-500 to-amber-500 flex items-center justify-center mb-5 shadow-xl shadow-brand-sky-500/30">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-brand-navy-900 mb-3">
              Your Personalized Power Targets
            </h3>
            <p className="text-brand-navy-600 mb-6 text-lg">
              Get altitude-adjusted power zones calculated for your FTP and this specific race course.
            </p>

            <div className="grid grid-cols-2 gap-3 text-left mb-6 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Altitude adjusted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Terrain-specific</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Safe/Tempo/Pushing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Physics-based model</span>
              </div>
            </div>

            <Button
              onClick={showUpgrade}
              size="lg"
              className="bg-gradient-to-r from-brand-sky-500 to-amber-500 hover:from-brand-sky-600 hover:to-amber-600 text-white shadow-lg shadow-brand-sky-500/25 gap-2 text-base px-8"
            >
              Unlock Power Targets
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
