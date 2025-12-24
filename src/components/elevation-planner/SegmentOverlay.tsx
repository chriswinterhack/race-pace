"use client";

import { useMemo, useCallback, RefObject, useState, useEffect } from "react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { EFFORT_COLORS, type PlannerSegment } from "./types";
import { cn } from "@/lib/utils";

interface SegmentOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onSegmentClick?: (segmentId: string) => void;
}

// Chart margins (must match ElevationChart)
const CHART_MARGINS = {
  top: 20,
  right: 20,
  left: 55, // Y-axis width
  bottom: 35, // margin(20) + XAxis height(~15)
};

export function SegmentOverlay({ containerRef, onSegmentClick }: SegmentOverlayProps) {
  const {
    elevationData,
    segments,
    selectedSegmentId,
    selectSegment,
  } = useElevationPlannerStore();

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
  const mileToX = useCallback(
    (mile: number) => {
      const maxMile = elevationData[elevationData.length - 1]?.mile || 1;
      return chartArea.left + (mile / maxMile) * chartArea.width;
    },
    [elevationData, chartArea]
  );

  // Convert elevation to Y coordinate
  const elevationToY = useCallback(
    (elevation: number) => {
      const range = elevationDomain.max - elevationDomain.min;
      const normalized = (elevation - elevationDomain.min) / range;
      return chartArea.top + chartArea.height * (1 - normalized);
    },
    [elevationDomain, chartArea]
  );

  // Generate SVG path for a segment that follows the elevation contour
  const generateSegmentPath = useCallback(
    (segment: PlannerSegment) => {
      // Get elevation points within this segment
      const segmentPoints = elevationData.filter(
        (p) => p.mile >= segment.start_mile && p.mile <= segment.end_mile
      );

      if (segmentPoints.length < 2) return "";

      // Build path: top edge follows elevation, bottom is flat
      const topPath = segmentPoints
        .map((p, i) => {
          const x = mileToX(p.mile);
          const y = elevationToY(p.elevation);
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

      // Bottom edge
      const startX = mileToX(segment.start_mile);
      const endX = mileToX(segment.end_mile);
      const bottomY = chartArea.top + chartArea.height;

      return `${topPath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
    },
    [elevationData, mileToX, elevationToY, chartArea]
  );

  // Handle segment click
  const handleSegmentClick = useCallback(
    (segment: PlannerSegment, e: React.MouseEvent) => {
      e.stopPropagation();
      selectSegment(segment.id);
      onSegmentClick?.(segment.id);
    },
    [selectSegment, onSegmentClick]
  );

  if (segments.length === 0 || chartArea.width === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <defs>
        {/* Gradient definitions for each effort level */}
        {Object.entries(EFFORT_COLORS).map(([effort, config]) => (
          <linearGradient
            key={effort}
            id={`segment-gradient-${effort}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={config.stroke} stopOpacity={0.5} />
            <stop offset="100%" stopColor={config.stroke} stopOpacity={0.1} />
          </linearGradient>
        ))}

        {/* Selection glow filter */}
        <filter id="segment-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render segments */}
      {segments.map((segment) => {
        const isSelected = selectedSegmentId === segment.id;
        const path = generateSegmentPath(segment);

        if (!path) return null;

        return (
          <g key={segment.id} className="pointer-events-auto">
            {/* Selection highlight - light overlay when selected */}
            {isSelected && (
              <path
                d={path}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="none"
              />
            )}
            {/* Segment fill area - no stroke to avoid double lines */}
            <path
              d={path}
              fill={isSelected ? "rgba(56, 189, 248, 0.3)" : `url(#segment-gradient-${segment.effort_level})`}
              stroke="none"
              className={cn(
                "cursor-pointer transition-all duration-200",
                "hover:fill-opacity-60"
              )}
              onClick={(e) => handleSegmentClick(segment, e)}
            />
          </g>
        );
      })}
    </svg>
  );
}
