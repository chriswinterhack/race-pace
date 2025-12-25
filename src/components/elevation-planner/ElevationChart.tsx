"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { CHART_THEME, EFFORT_COLORS, type TooltipData } from "./types";
import { SegmentOverlay } from "./SegmentOverlay";
import { AidStationMarkers } from "./AidStationMarkers";
import { SegmentAnnotations } from "./SegmentAnnotations";
import { cn, getDistanceUnit, getElevationUnit, formatElevation, getDisplayDistance, getDisplayElevation } from "@/lib/utils";
import { useUnits } from "@/hooks";

interface ElevationChartProps {
  className?: string;
  raceStartTime?: string;
  onSegmentClick?: (segmentId: string) => void;
}

export function ElevationChart({ className, raceStartTime = "06:00", onSegmentClick }: ElevationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const {
    elevationData,
    segments,
    annotations,
    hoveredMile,
    setHoveredMile,
  } = useElevationPlannerStore();
  const { units } = useUnits();

  // Calculate elevation domain
  const { minElevation, maxElevation } = useMemo(() => {
    if (elevationData.length === 0) {
      return { minElevation: 0, maxElevation: 1000 };
    }
    const elevations = elevationData.map((d) => d.elevation);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    // Add padding
    const padding = (max - min) * 0.1;
    return {
      minElevation: Math.floor((min - padding) / 100) * 100,
      maxElevation: Math.ceil((max + padding) / 100) * 100,
    };
  }, [elevationData]);

  // Find segment at a given mile
  const findSegmentAtMile = useCallback(
    (mile: number) => {
      return segments.find((s) => mile >= s.start_mile && mile <= s.end_mile);
    },
    [segments]
  );

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || elevationData.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const chartLeft = 60; // Approximate Y-axis width
      const chartRight = rect.width - 20; // Right margin
      const chartWidth = chartRight - chartLeft;

      if (x < chartLeft || x > chartRight) {
        setTooltipData(null);
        setHoveredMile(null);
        return;
      }

      // Calculate mile from X position
      const maxMile = elevationData[elevationData.length - 1]?.mile || 0;
      const mile = ((x - chartLeft) / chartWidth) * maxMile;

      // Find closest elevation point
      const closest = elevationData.reduce((prev, curr) =>
        Math.abs(curr.mile - mile) < Math.abs(prev.mile - mile) ? curr : prev
      );

      const segment = findSegmentAtMile(closest.mile);

      setHoveredMile(closest.mile);
      setTooltipData({
        mile: closest.mile,
        elevation: closest.elevation,
        gradient: closest.gradient,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        segment,
      });
    },
    [elevationData, findSegmentAtMile, setHoveredMile]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
    setHoveredMile(null);
  }, [setHoveredMile]);

  // Format gradient display
  const formatGradient = (gradient: number) => {
    const sign = gradient >= 0 ? "+" : "";
    return `${sign}${gradient.toFixed(1)}%`;
  };

  // Gradient color based on value
  const getGradientColor = (gradient: number) => {
    if (gradient >= 6) return "text-red-400";
    if (gradient >= 3) return "text-orange-400";
    if (gradient > 0) return "text-green-400";
    if (gradient <= -6) return "text-purple-400";
    if (gradient <= -3) return "text-blue-400";
    return "text-slate-400";
  };

  if (elevationData.length === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-b from-brand-navy-900 to-brand-navy-950",
          "border border-white/5",
          "h-80 flex items-center justify-center",
          className
        )}
      >
        <p className="text-brand-navy-400">No elevation data available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-b from-brand-navy-900 to-brand-navy-950",
        "border border-white/5",
        "h-80",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main chart */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={elevationData}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          <defs>
            {/* Dark theme gradient for elevation area */}
            <linearGradient id="elevationGradientDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="mile"
            tick={{ fontSize: 11, fill: CHART_THEME.axisText }}
            tickFormatter={(value) => `${Math.round(getDisplayDistance(value, units))}`}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickCount={10}
            label={{
              value: units === "metric" ? "Kilometers" : "Miles",
              position: "bottom",
              offset: 0,
              fill: CHART_THEME.axisText,
              fontSize: 11,
            }}
          />

          <YAxis
            domain={[minElevation, maxElevation]}
            tick={{ fontSize: 11, fill: CHART_THEME.axisText }}
            tickFormatter={(value) => `${Math.round(getDisplayElevation(value, units)).toLocaleString()}`}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={55}
            label={{
              value: `Elevation (${getElevationUnit(units)})`,
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: CHART_THEME.axisText,
              fontSize: 11,
            }}
          />

          {/* Hover position line */}
          {hoveredMile !== null && (
            <ReferenceLine
              x={hoveredMile}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
            />
          )}

          {/* Main elevation area - subtle base layer, segments provide the main visual */}
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="none"
            fill="url(#elevationGradientDark)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Segment overlay - positioned on top of chart */}
      <SegmentOverlay
        containerRef={containerRef}
        onSegmentClick={onSegmentClick}
      />

      {/* Segment annotations (power badges, split times) */}
      <SegmentAnnotations
        containerRef={containerRef}
        showPower={true}
        showTime={true}
      />

      {/* Aid station markers with arrival times */}
      <AidStationMarkers
        containerRef={containerRef}
        raceStartTime={raceStartTime}
      />

      {/* Custom tooltip */}
      {tooltipData && (
        <div
          className="absolute pointer-events-none z-50 transform -translate-x-1/2"
          style={{
            left: Math.min(Math.max(tooltipData.x, 100), (containerRef.current?.clientWidth || 300) - 100),
            top: 16,
          }}
        >
          <div
            className={cn(
              "px-4 py-3 rounded-xl",
              "bg-brand-navy-900/95 backdrop-blur-xl",
              "border border-white/10",
              "shadow-2xl shadow-black/50"
            )}
          >
            {/* Distance marker */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                {getDisplayDistance(tooltipData.mile, units).toFixed(1)}
              </span>
              <span className="text-sm text-brand-navy-400">{getDistanceUnit(units)}</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              {/* Elevation */}
              <div className="flex items-center gap-1.5">
                <span className="text-brand-navy-400">Elev</span>
                <span className="text-white font-medium tabular-nums">
                  {formatElevation(tooltipData.elevation, units)}
                </span>
              </div>

              {/* Gradient */}
              <div className="flex items-center gap-1.5">
                <span className="text-brand-navy-400">Grade</span>
                <span className={cn("font-medium tabular-nums", getGradientColor(tooltipData.gradient))}>
                  {formatGradient(tooltipData.gradient)}
                </span>
              </div>
            </div>

            {/* Segment info if available */}
            {tooltipData.segment && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      EFFORT_COLORS[tooltipData.segment.effort_level].badge
                    )}
                  />
                  <span className="text-sm text-brand-navy-300">
                    {tooltipData.segment.start_name} → {tooltipData.segment.end_name}
                  </span>
                </div>
                {annotations.powerTargets && (
                  <div className="mt-1 text-xs text-brand-navy-400">
                    Power: {tooltipData.segment.power_target_low}-{tooltipData.segment.power_target_high}W
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
