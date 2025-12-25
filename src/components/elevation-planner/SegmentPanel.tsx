"use client";

import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Clock, Mountain, TrendingUp, ChevronUp, ChevronDown, Minus, Pencil, Check } from "lucide-react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { EFFORT_COLORS, PACE_MULTIPLIERS, type PlannerSegment } from "./types";
import type { EffortLevel } from "@/types";
import { Button } from "@/components/ui";
import { cn, formatDistance, formatElevation } from "@/lib/utils";
import { useUnits } from "@/hooks";

interface SegmentPanelProps {
  segment: PlannerSegment;
  athleteFTP?: number;
  athleteWeight?: number;
  onClose: () => void;
  onSave?: (segment: PlannerSegment) => void;
}

export function SegmentPanel({
  segment,
  athleteFTP = 250,
  athleteWeight = 75,
  onClose,
  onSave,
}: SegmentPanelProps) {
  const { updateSegmentEffort, updateSegmentTime, elevationData } = useElevationPlannerStore();
  const { units } = useUnits();
  const [mounted, setMounted] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState(Math.floor(segment.target_time_minutes / 60));
  const [editMinutes, setEditMinutes] = useState(segment.target_time_minutes % 60);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  // Track mount state for portal (SSR safety)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync edit state when segment changes
  useEffect(() => {
    setEditHours(Math.floor(segment.target_time_minutes / 60));
    setEditMinutes(segment.target_time_minutes % 60);
    setIsEditingTime(false);
  }, [segment.id, segment.target_time_minutes]);

  // Focus hours input when editing starts
  useEffect(() => {
    if (isEditingTime && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [isEditingTime]);

  // Save edited time
  const handleSaveTime = useCallback(() => {
    const newTime = Math.max(1, editHours * 60 + editMinutes);
    updateSegmentTime(segment.id, newTime);
    onSave?.({ ...segment, target_time_minutes: newTime });
    setIsEditingTime(false);
  }, [editHours, editMinutes, segment, updateSegmentTime, onSave]);

  // Handle Enter key in time inputs
  const handleTimeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTime();
    } else if (e.key === "Escape") {
      setEditHours(Math.floor(segment.target_time_minutes / 60));
      setEditMinutes(segment.target_time_minutes % 60);
      setIsEditingTime(false);
    }
  }, [handleSaveTime, segment.target_time_minutes]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Calculate segment statistics
  const segmentStats = useMemo(() => {
    const points = elevationData.filter(
      (p) => p.mile >= segment.start_mile && p.mile <= segment.end_mile
    );

    if (points.length === 0) {
      return {
        distance: segment.end_mile - segment.start_mile,
        avgGradient: 0,
        maxGradient: 0,
        minGradient: 0,
        elevationGain: 0,
        elevationLoss: 0,
      };
    }

    const gradients = points.map((p) => p.gradient);
    const avgGradient = gradients.reduce((a, b) => a + b, 0) / gradients.length;

    // Calculate elevation change
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < points.length; i++) {
      const diff = (points[i]?.elevation || 0) - (points[i - 1]?.elevation || 0);
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    return {
      distance: segment.end_mile - segment.start_mile,
      avgGradient: Math.round(avgGradient * 10) / 10,
      maxGradient: Math.round(Math.max(...gradients) * 10) / 10,
      minGradient: Math.round(Math.min(...gradients) * 10) / 10,
      elevationGain: Math.round(gain),
      elevationLoss: Math.round(loss),
    };
  }, [segment, elevationData]);

  // Calculate W/kg from power
  const powerToWkg = useCallback(
    (watts: number) => {
      if (!athleteWeight) return 0;
      return Math.round((watts / athleteWeight) * 100) / 100;
    },
    [athleteWeight]
  );

  // Handle effort level change
  const handleEffortChange = useCallback(
    (effort: EffortLevel) => {
      // Calculate time adjustment based on pace multiplier change
      const oldMultiplier = PACE_MULTIPLIERS[segment.effort_level];
      const newMultiplier = PACE_MULTIPLIERS[effort];
      // Adjust time: if going from tempo (1.0) to safe (1.05), multiply time by 1.05
      // First normalize to tempo, then apply new multiplier
      const baseTime = segment.target_time_minutes / oldMultiplier;
      const newTime = Math.round(baseTime * newMultiplier);

      updateSegmentEffort(segment.id, effort);
      updateSegmentTime(segment.id, newTime);

      // Calculate new power targets based on effort
      const IF = { safe: 0.67, tempo: 0.70, pushing: 0.73 }[effort];
      const targetNP = athleteFTP * IF;
      const updatedSegment = {
        ...segment,
        effort_level: effort,
        target_time_minutes: newTime,
        power_target_low: Math.round(targetNP * 0.95),
        power_target_high: Math.round(targetNP * 1.05),
      };
      onSave?.(updatedSegment);
    },
    [segment, updateSegmentEffort, updateSegmentTime, athleteFTP, onSave]
  );

  // Handle time adjustment
  const adjustTime = useCallback(
    (delta: number) => {
      const newTime = Math.max(1, segment.target_time_minutes + delta);
      updateSegmentTime(segment.id, newTime);
      onSave?.({ ...segment, target_time_minutes: newTime });
    },
    [segment, updateSegmentTime, onSave]
  );

  // Format time display
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Calculate pace (min/mile)
  const pace = segmentStats.distance > 0
    ? segment.target_time_minutes / segmentStats.distance
    : 0;

  const effortConfig = EFFORT_COLORS[segment.effort_level];

  // Don't render on server
  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel - centered vertically with max height */}
      <div
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 w-[380px] max-h-[85vh] z-[9999]",
          "bg-brand-navy-900 border border-white/10 rounded-2xl",
          "shadow-2xl shadow-black/50",
          "flex flex-col overflow-hidden",
          "animate-in slide-in-from-right duration-200"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span
              className={cn("w-3 h-3 rounded-full", effortConfig.badge)}
            />
            <div>
              <h3 id="segment-panel-title" className="text-white font-semibold">{segment.start_name}</h3>
              <p className="text-brand-navy-400 text-sm">→ {segment.end_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-brand-navy-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Effort Level Selector */}
          <div>
            <label className="text-sm text-brand-navy-400 mb-3 block">Effort Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(["safe", "tempo", "pushing"] as EffortLevel[]).map((effort) => {
                const config = EFFORT_COLORS[effort];
                const isSelected = segment.effort_level === effort;
                return (
                  <button
                    key={effort}
                    onClick={() => handleEffortChange(effort)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium",
                      "transition-all duration-200",
                      "border",
                      isSelected
                        ? cn(config.badge, "text-white border-transparent")
                        : "bg-white/5 text-brand-navy-300 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segment Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Mountain className="h-4 w-4" />}
              label="Distance"
              value={formatDistance(segmentStats.distance, units)}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg Grade"
              value={`${segmentStats.avgGradient >= 0 ? "+" : ""}${segmentStats.avgGradient}%`}
              valueColor={
                segmentStats.avgGradient >= 3
                  ? "text-orange-400"
                  : segmentStats.avgGradient <= -3
                    ? "text-blue-400"
                    : "text-white"
              }
            />
            <StatCard
              icon={<ChevronUp className="h-4 w-4 text-green-400" />}
              label="Gain"
              value={formatElevation(segmentStats.elevationGain, units)}
            />
            <StatCard
              icon={<ChevronDown className="h-4 w-4 text-red-400" />}
              label="Loss"
              value={formatElevation(segmentStats.elevationLoss, units)}
            />
          </div>

          {/* Time Allocation */}
          <div>
            <label className="text-sm text-brand-navy-400 mb-3 block flex items-center justify-between">
              <span>Target Split Time</span>
              {!isEditingTime && (
                <button
                  onClick={() => setIsEditingTime(true)}
                  className="flex items-center gap-1 text-xs text-brand-sky-400 hover:text-brand-sky-300"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </label>

            {isEditingTime ? (
              /* Direct time input mode */
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <input
                      ref={hoursInputRef}
                      type="number"
                      min={0}
                      max={24}
                      value={editHours}
                      onChange={(e) => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                      onKeyDown={handleTimeKeyDown}
                      className={cn(
                        "w-16 h-14 text-center text-2xl font-bold tabular-nums",
                        "bg-white/10 border border-brand-sky-500/50 rounded-xl",
                        "text-white focus:outline-none focus:border-brand-sky-400"
                      )}
                    />
                    <span className="text-xs text-brand-navy-500 mt-1">hours</span>
                  </div>
                  <span className="text-2xl font-bold text-brand-navy-400 pb-5">:</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={editMinutes.toString().padStart(2, "0")}
                      onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      onKeyDown={handleTimeKeyDown}
                      className={cn(
                        "w-16 h-14 text-center text-2xl font-bold tabular-nums",
                        "bg-white/10 border border-brand-sky-500/50 rounded-xl",
                        "text-white focus:outline-none focus:border-brand-sky-400"
                      )}
                    />
                    <span className="text-xs text-brand-navy-500 mt-1">minutes</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditHours(Math.floor(segment.target_time_minutes / 60));
                      setEditMinutes(segment.target_time_minutes % 60);
                      setIsEditingTime(false);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium",
                      "bg-white/5 border border-white/10 text-brand-navy-300",
                      "hover:bg-white/10 transition-colors"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTime}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium",
                      "bg-brand-sky-500 text-white",
                      "hover:bg-brand-sky-600 transition-colors",
                      "flex items-center justify-center gap-1"
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* Quick adjust mode */
              <div className="flex items-center gap-4">
                <button
                  onClick={() => adjustTime(-5)}
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    "bg-white/10 border border-white/20",
                    "text-white hover:bg-white/20 transition-colors"
                  )}
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsEditingTime(true)}
                  className="flex-1 text-center group cursor-pointer"
                >
                  <div className="text-3xl font-bold text-white tabular-nums group-hover:text-brand-sky-400 transition-colors">
                    {formatTime(segment.target_time_minutes)}
                  </div>
                  <div className="text-sm text-brand-navy-400 mt-1">
                    {pace.toFixed(1)} min/mi · click to edit
                  </div>
                </button>
                <button
                  onClick={() => adjustTime(5)}
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    "bg-white/10 border border-white/20",
                    "text-white hover:bg-white/20 transition-colors"
                  )}
                >
                  <span className="text-xl font-medium">+</span>
                </button>
              </div>
            )}
          </div>

          {/* Power Targets */}
          <div>
            <label className="text-sm text-brand-navy-400 mb-3 block flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Power Target
            </label>
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-gradient-to-br from-white/5 to-transparent",
                "border border-white/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  {segment.power_target_low > 0 && segment.power_target_high > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-white tabular-nums">
                        {segment.power_target_low}-{segment.power_target_high}
                        <span className="text-lg font-normal text-brand-navy-400 ml-1">W</span>
                      </div>
                      <div className="text-sm text-brand-navy-400 mt-1">
                        {powerToWkg(segment.power_target_low)}-{powerToWkg(segment.power_target_high)} W/kg
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-medium text-brand-navy-400">
                        Not calculated
                      </div>
                      <div className="text-sm text-brand-navy-500 mt-1">
                        Set athlete FTP to see targets
                      </div>
                    </>
                  )}
                </div>
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    effortConfig.badge,
                    "opacity-50"
                  )}
                >
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Time */}
          {segment.arrivalTime && (
            <div>
              <label className="text-sm text-brand-navy-400 mb-3 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated Arrival
              </label>
              <div
                className={cn(
                  "rounded-xl p-4 text-center",
                  "bg-gradient-to-br from-white/5 to-transparent",
                  "border border-white/10"
                )}
              >
                <div className="text-3xl font-bold text-white tabular-nums">
                  {segment.arrivalTime}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm text-brand-navy-400 mb-3 block">
              Strategy Notes
            </label>
            <textarea
              defaultValue={segment.strategy_notes || ""}
              placeholder="Add notes for this segment..."
              className={cn(
                "w-full h-24 rounded-xl p-3",
                "bg-white/5 border border-white/10",
                "text-white placeholder:text-brand-navy-500",
                "resize-none",
                "focus:outline-none focus:border-brand-sky-500/50"
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            className="w-full bg-brand-sky-500 hover:bg-brand-sky-600 text-white"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// Stat card sub-component
function StatCard({
  icon,
  label,
  value,
  valueColor = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3",
        "bg-white/5 border border-white/10"
      )}
    >
      <div className="flex items-center gap-2 text-brand-navy-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className={cn("text-lg font-semibold tabular-nums", valueColor)}>
        {value}
      </div>
    </div>
  );
}
