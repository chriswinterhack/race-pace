"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Mountain, Loader2, Eye, EyeOff, Keyboard } from "lucide-react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { useElevationData } from "./hooks/useElevationData";
import { ElevationChart } from "./ElevationChart";
import { SegmentPanel } from "./SegmentPanel";
import { EffortPresets } from "./EffortPresets";
import { TimelineSummary } from "./TimelineSummary";
import { EFFORT_PRESETS, type PlannerSegment, type PlannerAidStation, calculateArrivalTime, calculatePowerTargets } from "./types";
import type { Segment, AidStation } from "@/types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ElevationPlannerProps {
  gpxUrl: string | null | undefined;
  segments: Segment[];
  aidStations: AidStation[];
  racePlanId: string;
  raceStartTime?: string; // HH:MM format
  athleteFTP?: number;
  athleteWeight?: number;
  onSegmentUpdate?: (segment: Segment) => void;
  onSegmentsChange?: (segments: Segment[]) => void;
  className?: string;
}

export function ElevationPlanner({
  gpxUrl,
  segments: initialSegments,
  aidStations: initialAidStations,
  racePlanId,
  raceStartTime = "06:00",
  athleteFTP = 250,
  athleteWeight = 75,
  onSegmentUpdate,
  onSegmentsChange,
  className,
}: ElevationPlannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const {
    setSegments,
    setAidStations,
    setRacePlanId,
    selectedSegmentId,
    selectSegment,
    segments,
    setAnnotations,
    applyEffortPreset,
  } = useElevationPlannerStore();

  // Load elevation data
  const { loading, error, points, totalDistance } = useElevationData({ gpxUrl });

  // Convert segments to planner segments with calculated properties
  const plannerSegments: PlannerSegment[] = useMemo(() => {
    if (initialSegments.length === 0) return [];

    let cumulativeTime = 0;

    return initialSegments.map((seg) => {
      // Calculate arrival time at end of segment (AM/PM format)
      cumulativeTime += seg.target_time_minutes;
      const arrivalTime = calculateArrivalTime(raceStartTime, cumulativeTime);

      // Calculate average gradient for segment
      const segmentPoints = points.filter(
        (p) => p.mile >= seg.start_mile && p.mile <= seg.end_mile
      );
      const avgGradient =
        segmentPoints.length > 0
          ? segmentPoints.reduce((sum, p) => sum + p.gradient, 0) / segmentPoints.length
          : 0;

      // Calculate power targets from athlete FTP if not already set
      let powerLow = seg.power_target_low;
      let powerHigh = seg.power_target_high;
      if ((!powerLow || !powerHigh || powerLow === 0) && athleteFTP > 0) {
        const targets = calculatePowerTargets(athleteFTP, seg.effort_level);
        powerLow = targets.low;
        powerHigh = targets.high;
      }

      return {
        ...seg,
        power_target_low: powerLow,
        power_target_high: powerHigh,
        distance: seg.end_mile - seg.start_mile,
        arrivalTime,
        avgGradient: Math.round(avgGradient * 10) / 10,
      };
    });
  }, [initialSegments, points, raceStartTime, athleteFTP]);

  // Convert aid stations to planner format
  const plannerAidStations: PlannerAidStation[] = useMemo(() => {
    return initialAidStations.map((station) => {
      // Find arrival time based on segment end times
      let cumulativeTime = 0;
      for (const seg of initialSegments) {
        if (seg.end_mile >= station.mile) {
          // Interpolate arrival time
          const segmentProgress =
            (station.mile - seg.start_mile) / (seg.end_mile - seg.start_mile);
          cumulativeTime += seg.target_time_minutes * segmentProgress;
          break;
        }
        cumulativeTime += seg.target_time_minutes;
      }

      // Use AM/PM format
      const arrivalTime = calculateArrivalTime(raceStartTime, cumulativeTime);

      return {
        ...station,
        arrivalTime,
        delayMinutes: 0, // Could be added later
      };
    });
  }, [initialAidStations, initialSegments, raceStartTime]);

  // Sync segments and aid stations to store
  useEffect(() => {
    setSegments(plannerSegments);
    setAidStations(plannerAidStations);
    setRacePlanId(racePlanId);
  }, [plannerSegments, plannerAidStations, racePlanId, setSegments, setAidStations, setRacePlanId]);

  // Find selected segment
  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId),
    [segments, selectedSegmentId]
  );

  // Handle segment click
  const handleSegmentClick = useCallback(
    (segmentId: string) => {
      selectSegment(segmentId);
    },
    [selectSegment]
  );

  // Handle segment save
  const handleSegmentSave = useCallback(
    (segment: PlannerSegment) => {
      // Convert back to base Segment type
      const baseSegment: Segment = {
        id: segment.id,
        race_plan_id: segment.race_plan_id,
        segment_order: segment.segment_order,
        start_mile: segment.start_mile,
        end_mile: segment.end_mile,
        start_name: segment.start_name,
        end_name: segment.end_name,
        target_time_minutes: segment.target_time_minutes,
        effort_level: segment.effort_level,
        power_target_low: segment.power_target_low,
        power_target_high: segment.power_target_high,
        nutrition_notes: segment.nutrition_notes,
        hydration_notes: segment.hydration_notes,
        terrain_notes: segment.terrain_notes,
        strategy_notes: segment.strategy_notes,
      };
      onSegmentUpdate?.(baseSegment);
    },
    [onSegmentUpdate]
  );

  // Handle preset application
  const handleApplyPreset = useCallback(
    (preset: keyof typeof EFFORT_PRESETS) => {
      applyEffortPreset(preset);
      // Notify parent of changes
      const updatedSegments = segments.map((seg) => ({
        id: seg.id,
        race_plan_id: seg.race_plan_id,
        segment_order: seg.segment_order,
        start_mile: seg.start_mile,
        end_mile: seg.end_mile,
        start_name: seg.start_name,
        end_name: seg.end_name,
        target_time_minutes: seg.target_time_minutes,
        effort_level: seg.effort_level,
        power_target_low: seg.power_target_low,
        power_target_high: seg.power_target_high,
        nutrition_notes: seg.nutrition_notes,
        hydration_notes: seg.hydration_notes,
        terrain_notes: seg.terrain_notes,
        strategy_notes: seg.strategy_notes,
      }));
      onSegmentsChange?.(updatedSegments);
    },
    [applyEffortPreset, segments, onSegmentsChange]
  );

  // Toggle all annotations
  const toggleAllAnnotations = useCallback(() => {
    const newValue = !showAnnotations;
    setShowAnnotations(newValue);
    setAnnotations({
      powerTargets: newValue,
      arrivalTimes: newValue,
      aidDelays: newValue,
      gradientInfo: newValue,
    });
  }, [showAnnotations, setAnnotations]);

  // Keyboard shortcuts for effort levels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if a segment is selected and not in an input
      if (!selectedSegmentId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const segment = segments.find((s) => s.id === selectedSegmentId);
      if (!segment) return;

      let newEffort: "safe" | "tempo" | "pushing" | null = null;

      switch (e.key) {
        case "1":
          newEffort = "safe";
          break;
        case "2":
          newEffort = "tempo";
          break;
        case "3":
          newEffort = "pushing";
          break;
        case "Escape":
          selectSegment(null);
          return;
        default:
          return;
      }

      if (newEffort && newEffort !== segment.effort_level) {
        // Update via store
        const { updateSegmentEffort } = useElevationPlannerStore.getState();
        updateSegmentEffort(segment.id, newEffort);

        // Notify parent with recalculated power targets
        const IF = { safe: 0.67, tempo: 0.70, pushing: 0.73 }[newEffort];
        const targetNP = athleteFTP * IF;
        const updatedSegment: Segment = {
          id: segment.id,
          race_plan_id: segment.race_plan_id,
          segment_order: segment.segment_order,
          start_mile: segment.start_mile,
          end_mile: segment.end_mile,
          start_name: segment.start_name,
          end_name: segment.end_name,
          target_time_minutes: segment.target_time_minutes,
          effort_level: newEffort,
          power_target_low: Math.round(targetNP * 0.95),
          power_target_high: Math.round(targetNP * 1.05),
          nutrition_notes: segment.nutrition_notes,
          hydration_notes: segment.hydration_notes,
          terrain_notes: segment.terrain_notes,
          strategy_notes: segment.strategy_notes,
        };
        onSegmentUpdate?.(updatedSegment);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSegmentId, segments, athleteFTP, selectSegment, onSegmentUpdate]);

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-b from-brand-navy-900 to-brand-navy-950",
          "border border-white/5",
          "h-96 flex items-center justify-center",
          className
        )}
      >
        <div className="flex items-center gap-3 text-brand-navy-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading elevation data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-b from-brand-navy-900 to-brand-navy-950",
          "border border-red-500/30",
          "h-96 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center px-6">
          <Mountain className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // No GPX data state
  if (!gpxUrl || points.length === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-b from-brand-navy-900 to-brand-navy-950",
          "border border-white/5 border-dashed",
          "h-96 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center px-6">
          <Mountain className="h-10 w-10 text-brand-navy-500 mx-auto mb-3" />
          <p className="text-brand-navy-400 mb-1">No GPX file available</p>
          <p className="text-sm text-brand-navy-500">
            Upload a GPX file to enable the interactive race planner
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EffortPresets onApplyPreset={handleApplyPreset} />
        </div>
        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts hint */}
          {selectedSegmentId && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-navy-400">
              <Keyboard className="h-3.5 w-3.5" />
              <span className="font-medium">1</span>=Safe
              <span className="font-medium ml-1">2</span>=Tempo
              <span className="font-medium ml-1">3</span>=Push
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllAnnotations}
            className="border-white/20 text-brand-navy-300 hover:bg-white/10 hover:text-white"
          >
            {showAnnotations ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Labels
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Labels
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main chart container */}
      <div ref={containerRef} className="relative">
        <ElevationChart
          raceStartTime={raceStartTime}
          onSegmentClick={handleSegmentClick}
        />
        {/* Removed SegmentHandles - too confusing for users */}
      </div>

      {/* Timeline summary */}
      <TimelineSummary
        segments={segments}
        aidStations={plannerAidStations}
        raceStartTime={raceStartTime}
        totalDistance={totalDistance}
      />

      {/* Segment detail panel */}
      {selectedSegment && (
        <SegmentPanel
          segment={selectedSegment}
          athleteFTP={athleteFTP}
          athleteWeight={athleteWeight}
          onClose={() => selectSegment(null)}
          onSave={handleSegmentSave}
        />
      )}
    </div>
  );
}
