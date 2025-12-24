import { create } from "zustand";
import type { EffortLevel } from "@/types";
import type {
  ElevationPoint,
  PlannerSegment,
  PlannerAidStation,
  AnnotationToggles,
  DragState,
  EffortPreset,
} from "@/components/elevation-planner/types";

interface ElevationPlannerState {
  // Data
  elevationData: ElevationPoint[];
  segments: PlannerSegment[];
  aidStations: PlannerAidStation[];

  // Race info
  racePlanId: string | null;
  totalDistance: number;

  // UI State
  selectedSegmentId: string | null;
  hoveredMile: number | null;
  isDragging: boolean;
  dragState: DragState | null;

  // Annotation toggles
  annotations: AnnotationToggles;

  // Actions
  setElevationData: (data: ElevationPoint[]) => void;
  setSegments: (segments: PlannerSegment[]) => void;
  setAidStations: (stations: PlannerAidStation[]) => void;
  setRacePlanId: (id: string | null) => void;
  setTotalDistance: (distance: number) => void;

  // Selection
  selectSegment: (id: string | null) => void;
  setHoveredMile: (mile: number | null) => void;

  // Dragging
  startDrag: (state: DragState) => void;
  updateDrag: (currentMile: number) => void;
  endDrag: () => void;

  // Segment mutations
  updateSegmentBoundary: (id: string, edge: "start" | "end", newMile: number) => void;
  updateSegmentEffort: (id: string, effort: EffortLevel) => void;
  updateSegmentTime: (id: string, targetMinutes: number) => void;

  // Presets
  applyEffortPreset: (preset: EffortPreset) => void;

  // Annotation toggles
  toggleAnnotation: (key: keyof AnnotationToggles) => void;
  setAnnotations: (toggles: Partial<AnnotationToggles>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  elevationData: [],
  segments: [],
  aidStations: [],
  racePlanId: null,
  totalDistance: 0,
  selectedSegmentId: null,
  hoveredMile: null,
  isDragging: false,
  dragState: null,
  annotations: {
    powerTargets: true,
    arrivalTimes: true,
    aidDelays: true,
    gradientInfo: false,
  },
};

export const useElevationPlannerStore = create<ElevationPlannerState>((set, get) => ({
  ...initialState,

  // Data setters
  setElevationData: (data) => set({ elevationData: data }),
  setSegments: (segments) => set({ segments }),
  setAidStations: (stations) => set({ aidStations: stations }),
  setRacePlanId: (id) => set({ racePlanId: id }),
  setTotalDistance: (distance) => set({ totalDistance: distance }),

  // Selection
  selectSegment: (id) => set({ selectedSegmentId: id }),
  setHoveredMile: (mile) => set({ hoveredMile: mile }),

  // Dragging
  startDrag: (dragState) => set({ isDragging: true, dragState }),

  updateDrag: (currentMile) => {
    const { dragState } = get();
    if (dragState) {
      set({ dragState: { ...dragState, currentMile } });
    }
  },

  endDrag: () => {
    const { dragState, segments } = get();
    if (dragState) {
      // Apply the boundary change
      const updatedSegments = segments.map((seg) => {
        if (seg.id === dragState.segmentId) {
          if (dragState.edge === "start") {
            return {
              ...seg,
              start_mile: dragState.currentMile,
              distance: seg.end_mile - dragState.currentMile,
            };
          } else {
            return {
              ...seg,
              end_mile: dragState.currentMile,
              distance: dragState.currentMile - seg.start_mile,
            };
          }
        }
        // Adjust adjacent segments
        const isNextSegment = seg.start_mile === dragState.initialMile && dragState.edge === "end";
        const isPrevSegment = seg.end_mile === dragState.initialMile && dragState.edge === "start";

        if (isNextSegment) {
          return {
            ...seg,
            start_mile: dragState.currentMile,
            distance: seg.end_mile - dragState.currentMile,
          };
        }
        if (isPrevSegment) {
          return {
            ...seg,
            end_mile: dragState.currentMile,
            distance: dragState.currentMile - seg.start_mile,
          };
        }
        return seg;
      });

      set({
        segments: updatedSegments,
        isDragging: false,
        dragState: null,
      });
    } else {
      set({ isDragging: false, dragState: null });
    }
  },

  // Segment mutations
  updateSegmentBoundary: (id, edge, newMile) => {
    const { segments } = get();
    const updatedSegments = segments.map((seg) => {
      if (seg.id === id) {
        if (edge === "start") {
          return {
            ...seg,
            start_mile: newMile,
            distance: seg.end_mile - newMile,
          };
        } else {
          return {
            ...seg,
            end_mile: newMile,
            distance: newMile - seg.start_mile,
          };
        }
      }
      return seg;
    });
    set({ segments: updatedSegments });
  },

  updateSegmentEffort: (id, effort) => {
    const { segments } = get();
    const updatedSegments = segments.map((seg) =>
      seg.id === id ? { ...seg, effort_level: effort } : seg
    );
    set({ segments: updatedSegments });
  },

  updateSegmentTime: (id, targetMinutes) => {
    const { segments } = get();
    const updatedSegments = segments.map((seg) =>
      seg.id === id ? { ...seg, target_time_minutes: targetMinutes } : seg
    );
    set({ segments: updatedSegments });
  },

  // Presets
  applyEffortPreset: (preset) => {
    const { segments, elevationData } = get();
    const presetConfig = {
      conservative: { defaultEffort: "safe" as EffortLevel, climbEffort: "safe" as EffortLevel },
      tempo: { defaultEffort: "tempo" as EffortLevel, climbEffort: "tempo" as EffortLevel },
      aggressive: { defaultEffort: "tempo" as EffortLevel, climbEffort: "pushing" as EffortLevel },
    }[preset];

    const updatedSegments = segments.map((seg) => {
      // Determine if this is a climbing segment based on average gradient
      const segmentPoints = elevationData.filter(
        (p) => p.mile >= seg.start_mile && p.mile <= seg.end_mile
      );
      const avgGradient = segmentPoints.length > 0
        ? segmentPoints.reduce((sum, p) => sum + p.gradient, 0) / segmentPoints.length
        : 0;

      const isClimbing = avgGradient >= 2; // 2% or more is climbing
      const effort = isClimbing ? presetConfig.climbEffort : presetConfig.defaultEffort;

      return { ...seg, effort_level: effort };
    });

    set({ segments: updatedSegments });
  },

  // Annotation toggles
  toggleAnnotation: (key) => {
    const { annotations } = get();
    set({
      annotations: {
        ...annotations,
        [key]: !annotations[key],
      },
    });
  },

  setAnnotations: (toggles) => {
    const { annotations } = get();
    set({
      annotations: {
        ...annotations,
        ...toggles,
      },
    });
  },

  // Reset
  reset: () => set(initialState),
}));
