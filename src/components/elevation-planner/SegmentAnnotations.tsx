"use client";

import { useMemo, RefObject, useState, useEffect } from "react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { EFFORT_COLORS, type PlannerSegment } from "./types";
import { formatDuration } from "@/lib/calculations";

interface SegmentAnnotationsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  showPower?: boolean;
  showTime?: boolean;
}

// Chart margins (must match ElevationChart)
const CHART_MARGINS = {
  top: 20,
  right: 20,
  left: 55,
  bottom: 35,
};

export function SegmentAnnotations({
  containerRef,
  showPower = true,
  showTime = true,
}: SegmentAnnotationsProps) {
  const {
    elevationData,
    segments,
    selectedSegmentId,
    annotations,
  } = useElevationPlannerStore();

  // Track container dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, [containerRef]);

  // Calculate chart area
  const chartArea = useMemo(() => {
    return {
      width: dimensions.width - CHART_MARGINS.left - CHART_MARGINS.right,
      height: dimensions.height - CHART_MARGINS.top - CHART_MARGINS.bottom,
      left: CHART_MARGINS.left,
      top: CHART_MARGINS.top,
    };
  }, [dimensions]);

  // Calculate elevation domain
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

  // Get average elevation for a segment (for badge positioning)
  const getSegmentCenterY = (segment: PlannerSegment) => {
    const segmentPoints = elevationData.filter(
      (p) => p.mile >= segment.start_mile && p.mile <= segment.end_mile
    );
    if (segmentPoints.length === 0) return chartArea.top + chartArea.height / 2;

    // Find the highest point in segment for positioning above
    const maxElev = Math.max(...segmentPoints.map((p) => p.elevation));
    return elevationToY(maxElev) - 20; // Position above the peak
  };

  // Calculate segment annotations
  const segmentAnnotations = useMemo(() => {
    return segments.map((segment) => {
      const startX = mileToX(segment.start_mile);
      const endX = mileToX(segment.end_mile);
      const centerX = (startX + endX) / 2;
      const centerY = getSegmentCenterY(segment);
      const width = endX - startX;

      // Only show annotations if segment is wide enough
      const showLabels = width > 60;

      return {
        segment,
        centerX,
        centerY,
        width,
        showLabels,
      };
    });
  }, [segments, elevationData, chartArea]);

  if (segments.length === 0 || chartArea.width === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        {/* Glass effect filter */}
        <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {segmentAnnotations.map(({ segment, centerX, centerY, width, showLabels }) => {
        if (!showLabels) return null;

        const isSelected = selectedSegmentId === segment.id;
        const effortConfig = EFFORT_COLORS[segment.effort_level];
        const hasPower = segment.power_target_low > 0 && segment.power_target_high > 0;

        // Format split time
        const splitTime = formatDuration(segment.target_time_minutes);

        // Position badges - time at top, power below
        const timeY = centerY;
        const powerY = centerY + 28;

        return (
          <g key={segment.id}>
            {/* Split time badge */}
            {showTime && (
              <g transform={`translate(${centerX}, ${timeY})`}>
                <rect
                  x={-32}
                  y={-12}
                  width={64}
                  height={24}
                  rx={12}
                  fill={isSelected ? "rgba(56, 189, 248, 0.95)" : "rgba(10, 25, 41, 0.9)"}
                  stroke={isSelected ? "rgba(56, 189, 248, 0.5)" : "rgba(255, 255, 255, 0.15)"}
                  strokeWidth={1}
                  filter="url(#badge-shadow)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="ui-monospace, monospace"
                >
                  {splitTime}
                </text>
              </g>
            )}

            {/* Power target badge */}
            {showPower && annotations.powerTargets && hasPower && (
              <g transform={`translate(${centerX}, ${powerY})`}>
                <rect
                  x={-28}
                  y={-10}
                  width={56}
                  height={20}
                  rx={10}
                  fill={effortConfig.fill}
                  stroke={effortConfig.stroke}
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="ui-monospace, monospace"
                >
                  {segment.power_target_low}-{segment.power_target_high}W
                </text>
              </g>
            )}

            {/* Segment number indicator (for narrow segments) */}
            {!showLabels && width > 30 && (
              <g transform={`translate(${centerX}, ${chartArea.top + chartArea.height - 20})`}>
                <circle
                  r={10}
                  fill={isSelected ? "rgba(56, 189, 248, 0.9)" : "rgba(10, 25, 41, 0.8)"}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                >
                  {segment.segment_order + 1}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
