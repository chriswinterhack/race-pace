// Main component
export { ElevationPlanner } from "./ElevationPlanner";

// Sub-components
export { ElevationChart } from "./ElevationChart";
export { SegmentOverlay } from "./SegmentOverlay";
export { SegmentAnnotations } from "./SegmentAnnotations";
export { SegmentHandle, SegmentHandles } from "./SegmentHandle";
export { AidStationMarkers } from "./AidStationMarkers";
export { SegmentPanel } from "./SegmentPanel";
export { EffortPresets } from "./EffortPresets";
export { TimelineSummary } from "./TimelineSummary";

// Hooks
export { useElevationData } from "./hooks/useElevationData";

// Types
export type {
  ElevationPoint,
  PlannerSegment,
  PlannerAidStation,
  AnnotationToggles,
  EffortVisualConfig,
  ChartTheme,
  EffortPreset,
  ChartScales,
  DragState,
  TooltipData,
} from "./types";

// Constants
export { EFFORT_COLORS, CHART_THEME, EFFORT_PRESETS } from "./types";
