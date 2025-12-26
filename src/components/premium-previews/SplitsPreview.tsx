"use client";

import {
  Timer,
  Mountain,
  TrendingUp,
  TrendingDown,
  Flag,
  ChevronRight,
  Clock,
  Gauge,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  List,
  BarChart3,
  Printer,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui";
import { usePremiumFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface SplitsPreviewProps {
  raceName?: string;
  distanceMiles?: number;
  goalTimeMinutes?: number;
  aidStationCount?: number;
}

// Sample splits that look realistic
const SAMPLE_SPLITS = [
  {
    id: "1",
    order: 1,
    startName: "Start Line",
    endName: "Cottonwood Pass",
    startMile: 0,
    endMile: 18.5,
    time: 82,
    arrivalTime: "7:22",
    effort: "safe",
    elevationGain: 2850,
    elevationLoss: 420,
    avgGrade: 5.2,
  },
  {
    id: "2",
    order: 2,
    startName: "Cottonwood Pass",
    endName: "Twin Lakes",
    startMile: 18.5,
    endMile: 36.2,
    time: 68,
    arrivalTime: "8:30",
    effort: "tempo",
    elevationGain: 1200,
    elevationLoss: 2100,
    avgGrade: -2.1,
  },
  {
    id: "3",
    order: 3,
    startName: "Twin Lakes",
    endName: "Sugarloaf Aid",
    startMile: 36.2,
    endMile: 51.8,
    time: 75,
    arrivalTime: "9:45",
    effort: "tempo",
    elevationGain: 1650,
    elevationLoss: 850,
    avgGrade: 2.8,
  },
  {
    id: "4",
    order: 4,
    startName: "Sugarloaf Aid",
    endName: "Pipeline Aid",
    startMile: 51.8,
    endMile: 68.4,
    time: 72,
    arrivalTime: "10:57",
    effort: "pushing",
    elevationGain: 980,
    elevationLoss: 1420,
    avgGrade: -1.5,
  },
  {
    id: "5",
    order: 5,
    startName: "Pipeline Aid",
    endName: "Finish Line",
    startMile: 68.4,
    endMile: 103.5,
    time: 145,
    arrivalTime: "13:22",
    effort: "safe",
    elevationGain: 2150,
    elevationLoss: 2980,
    avgGrade: -0.8,
    isLast: true,
  },
];

const EFFORT_CONFIG = {
  safe: {
    label: "Safe",
    color: "emerald",
    bgClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  tempo: {
    label: "Tempo",
    color: "sky",
    bgClass: "bg-sky-50 border-sky-200 text-sky-700",
  },
  pushing: {
    label: "Pushing",
    color: "orange",
    bgClass: "bg-orange-50 border-orange-200 text-orange-700",
  },
};

// Helper to format time
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function SplitsPreview({
  distanceMiles = 103.5,
}: SplitsPreviewProps) {
  const { showUpgrade } = usePremiumFeature("Race Splits");

  const totalTime = SAMPLE_SPLITS.reduce((sum, s) => sum + s.time, 0);
  const totalElevationGain = SAMPLE_SPLITS.reduce((sum, s) => sum + s.elevationGain, 0);
  const totalElevationLoss = SAMPLE_SPLITS.reduce((sum, s) => sum + s.elevationLoss, 0);
  const avgPacePerMile = totalTime / distanceMiles;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 text-white shadow-lg shadow-brand-sky-500/25">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-navy-900">Race Splits</h3>
              <p className="text-sm text-brand-navy-500">
                Your segment-by-segment time targets
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Disabled View Toggle */}
          <div className="flex items-center rounded-lg border border-brand-navy-200 bg-brand-navy-50 p-1 opacity-60">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-brand-navy-700 text-sm font-medium">
              <List className="h-4 w-4" />
              Table
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-brand-navy-400 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              Visual
            </div>
          </div>
          {/* Disabled Auto-Generate Button */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-navy-200 text-brand-navy-400 text-sm font-medium cursor-not-allowed">
            <Sparkles className="h-4 w-4" />
            Auto-Generate Splits
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="relative rounded-2xl border-2 border-brand-navy-200 overflow-hidden bg-white">
        <div className="p-6 space-y-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Flag className="h-3.5 w-3.5" />
                SPLITS
              </div>
              <p className="text-2xl font-bold text-brand-navy-900">{SAMPLE_SPLITS.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                TOTAL TIME
              </div>
              <p className="text-2xl font-bold font-mono text-brand-navy-900">{formatDuration(totalTime)}</p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Gauge className="h-3.5 w-3.5" />
                AVG PACE
              </div>
              <p className="text-2xl font-bold font-mono text-brand-navy-900">
                {formatDuration(avgPacePerMile)}<span className="text-sm font-normal text-brand-navy-500">/mi</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-navy-100 p-4">
              <div className="flex items-center gap-2 text-brand-navy-500 text-xs font-medium mb-1">
                <Mountain className="h-3.5 w-3.5" />
                ELEVATION
              </div>
              <p className="text-lg font-bold text-brand-navy-900">
                <span className="text-green-600">+{totalElevationGain.toLocaleString()}</span>
                <span className="text-brand-navy-300 mx-1">/</span>
                <span className="text-red-500">-{totalElevationLoss.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Splits Timeline */}
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-sky-400 via-brand-sky-300 to-brand-sky-400 hidden sm:block" />

            <div className="space-y-3">
              {SAMPLE_SPLITS.map((split, index) => {
                const effort = EFFORT_CONFIG[split.effort as keyof typeof EFFORT_CONFIG] || EFFORT_CONFIG.tempo;
                const distance = split.endMile - split.startMile;
                const isFirst = index === 0;
                const isLast = split.isLast;

                return (
                  <div
                    key={split.id}
                    className="group relative bg-white rounded-xl border border-brand-navy-100 hover:border-brand-navy-200 transition-all duration-200"
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-4 p-4">
                      {/* Split Number */}
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-colors",
                          isFirst
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                            : isLast
                              ? "bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 text-white"
                              : "bg-brand-navy-100 text-brand-navy-700 group-hover:bg-brand-navy-200"
                        )}>
                          {index + 1}
                        </div>
                        {/* Connection dot */}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rounded-full bg-brand-sky-400 border-2 border-white hidden sm:block" />
                      </div>

                      {/* Segment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-brand-navy-900 truncate">
                            {split.startName}
                          </h4>
                          <ChevronRight className="h-4 w-4 text-brand-navy-400 flex-shrink-0" />
                          <span className="font-medium text-brand-navy-900 truncate flex items-center gap-1.5">
                            {split.endName}
                            {isLast && <Flag className="h-4 w-4 text-brand-sky-500" />}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-brand-navy-500">
                            {distance.toFixed(1)} mi
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-green-600 font-medium">{split.elevationGain.toLocaleString()}</span>
                            <TrendingDown className="h-3.5 w-3.5 text-red-400 ml-1" />
                            <span className="text-red-500 font-medium">{split.elevationLoss.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      {/* Time & Arrival */}
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-brand-navy-500 uppercase tracking-wide">Split Time</p>
                          <p className="text-lg font-bold font-mono text-brand-navy-900">{formatDuration(split.time)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-brand-navy-500 uppercase tracking-wide">ETA</p>
                          <p className="text-lg font-bold text-brand-navy-900">
                            {split.arrivalTime}
                          </p>
                        </div>
                      </div>

                      {/* Effort Badge */}
                      <div className="flex-shrink-0">
                        <span className={cn(
                          "px-3 py-2 rounded-lg text-sm font-semibold border-2",
                          effort.bgClass
                        )}>
                          {effort.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Footer */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 p-6">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15h30M15 0v30' stroke='%23ffffff' stroke-opacity='0.1' fill='none'/%3E%3C/svg%3E\")"
              }}
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
                  <Flag className="h-6 w-6 text-brand-sky-400" />
                </div>
                <div>
                  <p className="text-brand-navy-300 text-sm">Race Finish</p>
                  <p className="text-white text-2xl font-bold font-mono">
                    {formatDuration(totalTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-brand-navy-400 text-xs uppercase tracking-wide">Distance</p>
                  <p className="text-white font-semibold">{distanceMiles} mi</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-navy-400 text-xs uppercase tracking-wide">Finish Time</p>
                  <p className="text-white font-semibold">
                    {SAMPLE_SPLITS[SAMPLE_SPLITS.length - 1]?.arrivalTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glass Overlay with CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/60 flex items-center justify-center">
          <div className="text-center px-6 max-w-xl">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-sky-500 to-purple-500 flex items-center justify-center mb-5 shadow-xl shadow-brand-sky-500/30">
              <Timer className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-brand-navy-900 mb-3">
              Race Day Pacing Strategy
            </h3>
            <p className="text-brand-navy-600 mb-5">
              Auto-generate terrain-adjusted splits based on aid stations and your goal time.
            </p>

            <div className="grid grid-cols-2 gap-2 text-left mb-5 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Auto-generate from GPX</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Terrain-adjusted times</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Edit effort levels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-brand-navy-700">Visual elevation view</span>
              </div>
            </div>

            {/* Top Tube Sticker Feature */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                  <Printer className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-amber-900">Print Top Tube Stickers</span>
              </div>
              <p className="text-sm text-amber-800">
                Export beautiful, print-ready stickers with your splits, checkpoints & arrival times — right on your bike for race day.
              </p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF Export</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Multiple Sizes</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Flag className="h-3.5 w-3.5" />
                  <span>Elevation Profile</span>
                </div>
              </div>
            </div>

            <Button
              onClick={showUpgrade}
              size="lg"
              className="bg-gradient-to-r from-brand-sky-500 to-amber-500 hover:from-brand-sky-600 hover:to-amber-600 text-white shadow-lg shadow-brand-sky-500/25 gap-2 text-base px-8"
            >
              Unlock Race Splits & Stickers
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
