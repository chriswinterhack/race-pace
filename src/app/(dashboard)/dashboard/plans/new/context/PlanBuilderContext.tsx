"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { EffortLevel, RaceDistance } from "@/types";

// Segment for the plan
export interface PlanSegment {
  id: string;
  startMile: number;
  endMile: number;
  startName: string;
  endName: string;
  targetTimeMinutes: number;
  effortLevel: EffortLevel;
  powerTargetLow: number;
  powerTargetHigh: number;
  nutritionNotes: string;
  hydrationNotes: string;
  terrainNotes: string;
  strategyNotes: string;
}

// Checkpoint with timing info
export interface CheckpointTiming {
  name: string;
  mile: number;
  elapsedMinutes: number;
  arrivalTime: string;
  cutoffTime?: string;
  cutoffMargin?: number;
  cutoffStatus?: "safe" | "caution" | "danger";
}

// Athlete profile for calculations
export interface AthleteSettings {
  ftp: number;
  weightKg: number;
  altitudeAdjustmentFactor: number;
  choPerHour: number;
  hydrationMlPerHour: number;
  sodiumMgPerHour: number;
}

// Wizard state
export interface PlanBuilderState {
  step: number;
  distanceId: string | null;
  distance: RaceDistance | null;
  raceName: string;
  raceLocation: string;
  goalTimeMinutes: number;
  startTime: string;
  athlete: AthleteSettings;
  segments: PlanSegment[];
  checkpoints: CheckpointTiming[];
  nutritionPlan: {
    choPerHour: number;
    hydrationMlPerHour: number;
    sodiumMgPerHour: number;
    perSegmentNotes: Record<string, { food: string; drink: string }>;
  };
  isLoading: boolean;
  error: string | null;
}

// Actions
type PlanBuilderAction =
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_DISTANCE"; distance: RaceDistance; raceName: string; raceLocation: string }
  | { type: "SET_GOAL_TIME"; goalTimeMinutes: number }
  | { type: "SET_START_TIME"; startTime: string }
  | { type: "SET_ATHLETE"; athlete: Partial<AthleteSettings> }
  | { type: "SET_SEGMENTS"; segments: PlanSegment[] }
  | { type: "UPDATE_SEGMENT"; segmentId: string; updates: Partial<PlanSegment> }
  | { type: "SET_CHECKPOINTS"; checkpoints: CheckpointTiming[] }
  | { type: "SET_NUTRITION"; nutrition: Partial<PlanBuilderState["nutritionPlan"]> }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RESET" };

// Initial state
const initialState: PlanBuilderState = {
  step: 1,
  distanceId: null,
  distance: null,
  raceName: "",
  raceLocation: "",
  goalTimeMinutes: 0,
  startTime: "06:00",
  athlete: {
    ftp: 250,
    weightKg: 75,
    altitudeAdjustmentFactor: 0.20,
    choPerHour: 90,
    hydrationMlPerHour: 750,
    sodiumMgPerHour: 750,
  },
  segments: [],
  checkpoints: [],
  nutritionPlan: {
    choPerHour: 90,
    hydrationMlPerHour: 750,
    sodiumMgPerHour: 750,
    perSegmentNotes: {},
  },
  isLoading: false,
  error: null,
};

// Reducer
function planBuilderReducer(
  state: PlanBuilderState,
  action: PlanBuilderAction
): PlanBuilderState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, 6) };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "SET_DISTANCE":
      return {
        ...state,
        distanceId: action.distance.id,
        distance: action.distance,
        raceName: action.raceName,
        raceLocation: action.raceLocation,
      };
    case "SET_GOAL_TIME":
      return { ...state, goalTimeMinutes: action.goalTimeMinutes };
    case "SET_START_TIME":
      return { ...state, startTime: action.startTime };
    case "SET_ATHLETE":
      return {
        ...state,
        athlete: { ...state.athlete, ...action.athlete },
      };
    case "SET_SEGMENTS":
      return { ...state, segments: action.segments };
    case "UPDATE_SEGMENT":
      return {
        ...state,
        segments: state.segments.map((seg) =>
          seg.id === action.segmentId
            ? { ...seg, ...action.updates }
            : seg
        ),
      };
    case "SET_CHECKPOINTS":
      return { ...state, checkpoints: action.checkpoints };
    case "SET_NUTRITION":
      return {
        ...state,
        nutritionPlan: { ...state.nutritionPlan, ...action.nutrition },
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// Context
interface PlanBuilderContextValue {
  state: PlanBuilderState;
  dispatch: React.Dispatch<PlanBuilderAction>;
  // Helper functions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canProceed: () => boolean;
}

const PlanBuilderContext = createContext<PlanBuilderContextValue | null>(null);

// Provider
export function PlanBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(planBuilderReducer, initialState);

  const nextStep = () => dispatch({ type: "NEXT_STEP" });
  const prevStep = () => dispatch({ type: "PREV_STEP" });
  const goToStep = (step: number) => dispatch({ type: "SET_STEP", step });

  const canProceed = (): boolean => {
    switch (state.step) {
      case 1:
        return state.distance !== null;
      case 2:
        return state.goalTimeMinutes > 0 && state.athlete.ftp > 0;
      case 3:
        return state.checkpoints.length > 0;
      case 4:
        return state.segments.length > 0;
      case 5:
        return state.nutritionPlan.choPerHour > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <PlanBuilderContext.Provider
      value={{ state, dispatch, nextStep, prevStep, goToStep, canProceed }}
    >
      {children}
    </PlanBuilderContext.Provider>
  );
}

// Hook
export function usePlanBuilder() {
  const context = useContext(PlanBuilderContext);
  if (!context) {
    throw new Error("usePlanBuilder must be used within a PlanBuilderProvider");
  }
  return context;
}

export const STEP_TITLES = [
  "Race Selection",
  "Goal Setting",
  "Checkpoint Review",
  "Segment Editor",
  "Nutrition Plan",
  "Review & Save",
];
