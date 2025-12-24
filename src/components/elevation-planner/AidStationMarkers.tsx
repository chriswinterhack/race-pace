"use client";

import { useMemo, RefObject, useState, useEffect } from "react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { calculateArrivalTime } from "./types";
import { useUnits } from "@/hooks";
import { formatDistance, formatElevationGain } from "@/lib/utils";

interface AidStationMarkersProps {
  containerRef: RefObject<HTMLDivElement | null>;
  raceStartTime: string;
  showCutoffs?: boolean;
}

// Chart margins (must match ElevationChart)
// Recharts uses margin + YAxis width for left offset
// margin: { top: 20, right: 20, left: 0, bottom: 20 } + YAxis width: 55
const CHART_MARGINS = {
  top: 20,
  right: 20,
  left: 55, // YAxis width
  bottom: 35, // margin(20) + XAxis height(~15)
};

export function AidStationMarkers({
  containerRef,
  raceStartTime,
  showCutoffs = true,
}: AidStationMarkersProps) {
  const { elevationData, segments, aidStations } = useElevationPlannerStore();
  const { units } = useUnits();

  // Track container dimensions with state to trigger re-renders
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Re-measure on resize
    window.addEventListener("resize", updateDimensions);

    // Also observe container size changes
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, [containerRef]);

  // Calculate chart area from tracked dimensions
  const chartArea = useMemo(() => {
    return {
      width: dimensions.width - CHART_MARGINS.left - CHART_MARGINS.right,
      height: dimensions.height - CHART_MARGINS.top - CHART_MARGINS.bottom,
      left: CHART_MARGINS.left,
      top: CHART_MARGINS.top,
    };
  }, [dimensions]);

  // Calculate elevation domain for Y positioning
  const elevationDomain = useMemo(() => {
    if (elevationData.length === 0) {
      return { min: 0, max: 1000 };
    }
    const elevations = elevationData.map((d) => d.elevation);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const padding = (max - min) * 0.1;
    return {
      min: Math.floor((min - padding) / 100) * 100,
      max: Math.ceil((max + padding) / 100) * 100,
    };
  }, [elevationData]);

  // Convert mile to X coordinate
  const mileToX = (mile: number) => {
    const maxMile = elevationData[elevationData.length - 1]?.mile || 1;
    return chartArea.left + (mile / maxMile) * chartArea.width;
  };

  // Convert elevation to Y coordinate
  const elevationToY = (elevation: number) => {
    const range = elevationDomain.max - elevationDomain.min;
    const normalized = (elevation - elevationDomain.min) / range;
    return chartArea.top + chartArea.height * (1 - normalized);
  };

  // Get elevation at a specific mile
  const getElevationAtMile = (mile: number): number => {
    if (elevationData.length === 0) return 0;

    // Find closest point
    let closest = elevationData[0];
    for (const point of elevationData) {
      if (Math.abs(point.mile - mile) < Math.abs((closest?.mile || 0) - mile)) {
        closest = point;
      }
    }
    return closest?.elevation || 0;
  };

  // Calculate arrival time at each aid station
  const aidStationsWithTimes = useMemo(() => {
    return aidStations.map((station) => {
      // Find cumulative time to this station from segments
      let cumulativeTime = 0;
      let cumulativeGain = 0;

      for (const seg of segments) {
        if (seg.end_mile <= station.mile) {
          cumulativeTime += seg.target_time_minutes;
          // Calculate elevation gain for this segment
          const segPoints = elevationData.filter(
            (p) => p.mile >= seg.start_mile && p.mile <= seg.end_mile
          );
          for (let i = 1; i < segPoints.length; i++) {
            const diff = (segPoints[i]?.elevation || 0) - (segPoints[i - 1]?.elevation || 0);
            if (diff > 0) cumulativeGain += diff;
          }
        } else if (seg.start_mile < station.mile && seg.end_mile > station.mile) {
          // Partial segment
          const segmentProgress = (station.mile - seg.start_mile) / (seg.end_mile - seg.start_mile);
          cumulativeTime += seg.target_time_minutes * segmentProgress;
        }
      }

      // Calculate arrival time (AM/PM format)
      const arrivalTime = calculateArrivalTime(raceStartTime, cumulativeTime);

      // Format elapsed time
      const elapsedHours = Math.floor(cumulativeTime / 60);
      const elapsedMins = Math.round(cumulativeTime % 60);
      const elapsedTime = elapsedHours > 0
        ? `${elapsedHours}h${elapsedMins.toString().padStart(2, "0")}m`
        : `${elapsedMins}m`;

      // Get elevation at this point
      const elevation = getElevationAtMile(station.mile);

      return {
        ...station,
        arrivalTime,
        elapsedTime,
        cumulativeTime,
        cumulativeGain: Math.round(cumulativeGain),
        elevation,
      };
    });
  }, [aidStations, segments, raceStartTime, elevationData]);

  // Also add start and finish markers
  const allMarkers = useMemo(() => {
    // Start time in AM/PM
    const startTime = calculateArrivalTime(raceStartTime, 0);

    // Total time and finish time
    const totalTime = segments.reduce((sum, s) => sum + s.target_time_minutes, 0);
    const finishTime = calculateArrivalTime(raceStartTime, totalTime);

    const totalHours = Math.floor(totalTime / 60);
    const totalMins = Math.round(totalTime % 60);
    const totalElapsed = totalHours > 0
      ? `${totalHours}h${totalMins.toString().padStart(2, "0")}m`
      : `${totalMins}m`;

    const maxMile = elevationData[elevationData.length - 1]?.mile || 0;

    // Calculate total elevation gain
    let totalGain = 0;
    for (let i = 1; i < elevationData.length; i++) {
      const diff = (elevationData[i]?.elevation || 0) - (elevationData[i - 1]?.elevation || 0);
      if (diff > 0) totalGain += diff;
    }

    const markers = [
      {
        name: "Start",
        mile: 0,
        arrivalTime: startTime,
        elapsedTime: "0m",
        cumulativeTime: 0,
        cumulativeGain: 0,
        elevation: elevationData[0]?.elevation || 0,
        isStart: true,
        isFinish: false,
        cutoff_time: null,
        delayMinutes: 0,
        supplies: [] as string[],
      },
      ...aidStationsWithTimes.map((s) => ({ ...s, isStart: false, isFinish: false })),
      {
        name: "Finish",
        mile: maxMile,
        arrivalTime: finishTime,
        elapsedTime: totalElapsed,
        cumulativeTime: totalTime,
        cumulativeGain: Math.round(totalGain),
        elevation: elevationData[elevationData.length - 1]?.elevation || 0,
        isStart: false,
        isFinish: true,
        cutoff_time: null,
        delayMinutes: 0,
        supplies: [] as string[],
      },
    ];

    return markers;
  }, [aidStationsWithTimes, segments, raceStartTime, elevationData]);

  if (elevationData.length === 0 || chartArea.width === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    >
      {allMarkers.map((marker, index) => {
        const x = mileToX(marker.mile);
        const elevY = elevationToY(marker.elevation);
        const topY = chartArea.top - 5;
        const bottomY = chartArea.top + chartArea.height + 5;

        // Check if cutoff is approaching (within 30 min)
        const hasCutoff = marker.cutoff_time !== null;
        // const isCutoffClose = hasCutoff && marker.cutoffMarginMinutes !== undefined && marker.cutoffMarginMinutes < 30;

        return (
          <g key={`marker-${index}`}>
            {/* Vertical line from top to elevation point */}
            <line
              x1={x}
              y1={topY + 30}
              x2={x}
              y2={elevY}
              stroke={marker.isStart ? "#22c55e" : marker.isFinish ? "#38bdf8" : "#f59e0b"}
              strokeWidth={marker.isStart || marker.isFinish ? 2 : 1.5}
              strokeOpacity={0.7}
            />

            {/* Icon at elevation point */}
            {marker.isStart ? (
              // Start icon - green play/go
              <g transform={`translate(${x}, ${elevY})`}>
                <circle r={9} fill="#22c55e" stroke="#fff" strokeWidth={2} />
                {/* Play arrow */}
                <path d="M-2,-4 L4,0 L-2,4 Z" fill="#fff" />
              </g>
            ) : marker.isFinish ? (
              // Finish icon - checkered flag
              <g transform={`translate(${x}, ${elevY})`}>
                <circle r={9} fill="#38bdf8" stroke="#fff" strokeWidth={2} />
                {/* Flag */}
                <path d="M-3,-5 L-3,5 M-3,-5 L4,-3 L-1,-1 L4,1 L-3,3" stroke="#fff" strokeWidth={1.5} fill="none" />
              </g>
            ) : (marker as any).type === "checkpoint" ? (
              // Checkpoint icon - purple flag
              <g transform={`translate(${x}, ${elevY})`}>
                <circle r={9} fill="#a855f7" stroke="#fff" strokeWidth={2} />
                {/* Flag */}
                <path d="M-2,-4 L-2,5 M-2,-4 L4,-2 L-2,0" stroke="#fff" strokeWidth={1.5} fill="#fff" />
              </g>
            ) : (
              // Aid station icon - cup/bottle
              <g transform={`translate(${x}, ${elevY})`}>
                <circle r={9} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                {/* Cup icon */}
                <path d="M-3,-4 L-2,4 L2,4 L3,-4 Z M3,-2 L5,-2 L5,0 L3,0" stroke="#fff" strokeWidth={1.2} fill="none" />
              </g>
            )}

            {/* Arrival time at top */}
            <g transform={`translate(${x}, ${topY})`}>
              {/* Time bubble */}
              <rect
                x={-28}
                y={-8}
                width={56}
                height={20}
                rx={10}
                fill={marker.isStart ? "#22c55e" : marker.isFinish ? "#38bdf8" : "rgba(10, 25, 41, 0.95)"}
                stroke={marker.isStart || marker.isFinish ? "transparent" : "rgba(255, 255, 255, 0.2)"}
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                y={2}
                fill="white"
                fontSize={11}
                fontWeight={600}
                fontFamily="system-ui"
              >
                {marker.arrivalTime}
              </text>
            </g>

            {/* Bottom info: mile, gain, elapsed */}
            <g transform={`translate(${x}, ${bottomY})`}>
              {/* Distance */}
              <text
                textAnchor="middle"
                dominantBaseline="hanging"
                y={2}
                fill="#9fb3c8"
                fontSize={10}
                fontWeight={600}
                fontFamily="system-ui"
              >
                {formatDistance(marker.mile, units)}
              </text>
              {/* Elevation gain */}
              <text
                textAnchor="middle"
                dominantBaseline="hanging"
                y={14}
                fill="#22c55e"
                fontSize={9}
                fontFamily="system-ui"
              >
                {formatElevationGain(marker.cumulativeGain, units)}
              </text>
              {/* Elapsed time */}
              <text
                textAnchor="middle"
                dominantBaseline="hanging"
                y={26}
                fill="#627d98"
                fontSize={9}
                fontFamily="system-ui"
              >
                {marker.elapsedTime}
              </text>
            </g>

            {/* Aid station name (between time and chart) */}
            {!marker.isStart && !marker.isFinish && (
              <text
                x={x}
                y={topY + 35}
                textAnchor="middle"
                dominantBaseline="hanging"
                fill="#9fb3c8"
                fontSize={9}
                fontFamily="system-ui"
                className="pointer-events-none"
              >
                {marker.name.length > 12 ? marker.name.slice(0, 10) + "..." : marker.name}
              </text>
            )}

            {/* Stop time badge (if aid station has delay) */}
            {marker.delayMinutes > 0 && (
              <g transform={`translate(${x + 15}, ${elevY - 15})`}>
                <rect
                  x={-18}
                  y={-10}
                  width={36}
                  height={20}
                  rx={10}
                  fill="#dc2626"
                  stroke="#fff"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="system-ui"
                >
                  {marker.delayMinutes}:00
                </text>
              </g>
            )}

            {/* Cutoff warning */}
            {hasCutoff && showCutoffs && (
              <g transform={`translate(${x}, ${elevY + 20})`}>
                <rect
                  x={-25}
                  y={-8}
                  width={50}
                  height={16}
                  rx={4}
                  fill="rgba(220, 38, 38, 0.9)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={9}
                  fontWeight={600}
                  fontFamily="system-ui"
                >
                  Cut: {marker.cutoff_time}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
