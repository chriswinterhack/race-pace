"use client";

import { useCallback, useEffect, useRef, RefObject } from "react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { cn } from "@/lib/utils";

interface SegmentHandleProps {
  containerRef: RefObject<HTMLDivElement | null>;
  segmentId: string;
  edge: "start" | "end";
  mile: number;
  onDragComplete?: (segmentId: string, newMile: number) => void;
}

// Chart margins (must match ElevationChart)
const CHART_MARGINS = {
  left: 55,
  right: 20,
};

export function SegmentHandle({
  containerRef,
  segmentId,
  edge,
  mile,
  onDragComplete,
}: SegmentHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);

  const {
    elevationData,
    isDragging,
    dragState,
    startDrag,
    updateDrag,
    endDrag,
  } = useElevationPlannerStore();

  // Calculate X position for this handle
  const getXPosition = useCallback(
    (m: number) => {
      if (!containerRef.current || elevationData.length === 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const chartWidth = rect.width - CHART_MARGINS.left - CHART_MARGINS.right;
      const maxMile = elevationData[elevationData.length - 1]?.mile || 1;
      return CHART_MARGINS.left + (m / maxMile) * chartWidth;
    },
    [containerRef, elevationData]
  );

  // Convert X position to mile
  const xToMile = useCallback(
    (x: number) => {
      if (!containerRef.current || elevationData.length === 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const chartWidth = rect.width - CHART_MARGINS.left - CHART_MARGINS.right;
      const maxMile = elevationData[elevationData.length - 1]?.mile || 1;
      const normalizedX = Math.max(0, Math.min(x - CHART_MARGINS.left, chartWidth));
      return (normalizedX / chartWidth) * maxMile;
    },
    [containerRef, elevationData]
  );

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag({
        segmentId,
        edge,
        initialMile: mile,
        currentMile: mile,
      });
    },
    [segmentId, edge, mile, startDrag]
  );

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging || !dragState || dragState.segmentId !== segmentId || dragState.edge !== edge) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newMile = xToMile(x);

      // Snap to 0.1 mile increments
      const snappedMile = Math.round(newMile * 10) / 10;
      updateDrag(snappedMile);
    };

    const handleMouseUp = () => {
      if (dragState) {
        onDragComplete?.(segmentId, dragState.currentMile);
      }
      endDrag();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragState, segmentId, edge, containerRef, xToMile, updateDrag, endDrag, onDragComplete]);

  // Determine if this handle is being dragged
  const isBeingDragged = isDragging && dragState?.segmentId === segmentId && dragState?.edge === edge;

  // Calculate current position
  const currentMile = isBeingDragged ? dragState?.currentMile ?? mile : mile;
  const xPos = getXPosition(currentMile);

  return (
    <div
      ref={handleRef}
      className={cn(
        "absolute top-0 h-full w-4 -ml-2 cursor-ew-resize z-40",
        "group"
      )}
      style={{ left: xPos }}
      onMouseDown={handleMouseDown}
    >
      {/* Vertical line */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-5 bottom-10 w-0.5",
          "transition-all duration-150",
          isBeingDragged
            ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            : "bg-white/30 group-hover:bg-white/60"
        )}
      />

      {/* Handle grip */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2",
          "w-3 h-10 rounded-full",
          "flex flex-col items-center justify-center gap-0.5",
          "transition-all duration-150",
          isBeingDragged
            ? "bg-white scale-110"
            : "bg-white/50 group-hover:bg-white/80 group-hover:scale-105"
        )}
      >
        {/* Grip dots */}
        <div className="w-1 h-1 rounded-full bg-brand-navy-900/50" />
        <div className="w-1 h-1 rounded-full bg-brand-navy-900/50" />
        <div className="w-1 h-1 rounded-full bg-brand-navy-900/50" />
      </div>

      {/* Mile indicator (shown when dragging) */}
      {isBeingDragged && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bottom-16",
            "px-2 py-1 rounded-md",
            "bg-brand-navy-900/95 backdrop-blur-sm",
            "border border-white/20",
            "text-white text-xs font-medium tabular-nums",
            "shadow-lg"
          )}
        >
          {currentMile.toFixed(1)} mi
        </div>
      )}
    </div>
  );
}

// Wrapper component that renders all segment handles
interface SegmentHandlesProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onBoundaryChange?: (segmentId: string, edge: "start" | "end", newMile: number) => void;
}

export function SegmentHandles({ containerRef, onBoundaryChange }: SegmentHandlesProps) {
  const { segments, elevationData } = useElevationPlannerStore();

  if (segments.length === 0 || elevationData.length === 0) {
    return null;
  }

  // Collect unique boundary positions
  const boundaries = new Map<number, { segmentId: string; edge: "start" | "end" }[]>();

  segments.forEach((segment) => {
    // Start boundary (except for first segment)
    if (segment.start_mile > 0) {
      const existing = boundaries.get(segment.start_mile) || [];
      existing.push({ segmentId: segment.id, edge: "start" });
      boundaries.set(segment.start_mile, existing);
    }

    // End boundary (except for last segment)
    const maxMile = elevationData[elevationData.length - 1]?.mile || 0;
    if (segment.end_mile < maxMile) {
      const existing = boundaries.get(segment.end_mile) || [];
      existing.push({ segmentId: segment.id, edge: "end" });
      boundaries.set(segment.end_mile, existing);
    }
  });

  return (
    <>
      {Array.from(boundaries.entries()).map(([mile, handles]) => {
        // Use the first handle's segment/edge for the draggable handle
        const primary = handles[0];
        if (!primary) return null;

        return (
          <SegmentHandle
            key={`handle-${mile}`}
            containerRef={containerRef}
            segmentId={primary.segmentId}
            edge={primary.edge}
            mile={mile}
            onDragComplete={(segmentId, newMile) => {
              onBoundaryChange?.(segmentId, primary.edge, newMile);
            }}
          />
        );
      })}
    </>
  );
}
