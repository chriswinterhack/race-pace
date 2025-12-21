"use client";

import { useEffect, useState } from "react";
import { Clock, Zap, User, Mountain } from "lucide-react";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePlanBuilder } from "../context/PlanBuilderContext";
import {
  calculateAltitudeAdjustedFTP,
  calculateTargetNP,
  calculateClimbPower,
  calculateFlatPower,
  calculateRequiredSpeed,
  parseDuration,
  formatDuration,
} from "@/lib/calculations";
import type { EffortLevel } from "@/types";

const EFFORT_LEVELS: EffortLevel[] = ["safe", "tempo", "pushing"];

export function GoalSetting() {
  const { state, dispatch } = usePlanBuilder();
  const [goalTimeInput, setGoalTimeInput] = useState("");

  // Initialize goal time input from state
  useEffect(() => {
    if (state.goalTimeMinutes > 0) {
      setGoalTimeInput(formatDuration(state.goalTimeMinutes));
    }
  }, []);

  // Update goal time when input changes
  const handleGoalTimeChange = (value: string) => {
    setGoalTimeInput(value);
    const minutes = parseDuration(value);
    if (minutes > 0) {
      dispatch({ type: "SET_GOAL_TIME", goalTimeMinutes: minutes });
    }
  };

  // Calculate power targets
  const adjustedFTP = calculateAltitudeAdjustedFTP(
    state.athlete.ftp,
    state.athlete.altitudeAdjustmentFactor
  );

  const powerTargets = EFFORT_LEVELS.map((level) => {
    const targetNP = calculateTargetNP(adjustedFTP, level);
    return {
      level,
      targetNP: Math.round(targetNP),
      climbPower: Math.round(calculateClimbPower(targetNP)),
      flatPower: Math.round(calculateFlatPower(targetNP)),
    };
  });

  // Calculate average speed needed
  const distance = state.distance?.distance_miles || 0;
  const avgSpeed =
    state.goalTimeMinutes > 0
      ? calculateRequiredSpeed(distance, state.goalTimeMinutes)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Set Your Goals
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Enter your goal time and athlete profile for personalized targets
        </p>
      </div>

      {/* Race Summary */}
      {state.distance && (
        <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-brand-navy-900">
                {state.raceName}
              </h3>
              <p className="text-sm text-brand-navy-600">
                {state.distance.name
                  ? `${state.distance.name} (${state.distance.distance_miles} mi)`
                  : `${state.distance.distance_miles} mi`}
                {state.distance.elevation_gain && (
                  <span className="ml-2">
                    · {state.distance.elevation_gain.toLocaleString()} ft gain
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goal Time & Start Time */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-medium text-brand-navy-900">
            <Clock className="h-5 w-5 text-brand-sky-500" />
            Race Timing
          </h3>

          <div className="space-y-4 p-4 rounded-lg bg-brand-navy-50">
            <div className="space-y-2">
              <Label htmlFor="goalTime">Goal Finish Time (HH:MM:SS)</Label>
              <Input
                id="goalTime"
                value={goalTimeInput}
                onChange={(e) => handleGoalTimeChange(e.target.value)}
                placeholder="08:30:00"
                className="font-mono"
              />
              {avgSpeed > 0 && (
                <p className="text-xs text-brand-navy-600">
                  Requires {avgSpeed.toFixed(1)} mph average speed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Race Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={state.startTime}
                onChange={(e) =>
                  dispatch({ type: "SET_START_TIME", startTime: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Athlete Profile */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-medium text-brand-navy-900">
            <User className="h-5 w-5 text-brand-sky-500" />
            Athlete Profile
          </h3>

          <div className="space-y-4 p-4 rounded-lg bg-brand-navy-50">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ftp">FTP (watts)</Label>
                <Input
                  id="ftp"
                  type="number"
                  value={state.athlete.ftp || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_ATHLETE",
                      athlete: { ftp: parseInt(e.target.value) || 0 },
                    })
                  }
                  placeholder="250"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={state.athlete.weightKg || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_ATHLETE",
                      athlete: { weightKg: parseFloat(e.target.value) || 0 },
                    })
                  }
                  placeholder="75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="altitude">Altitude Adjustment (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="altitude"
                  type="number"
                  value={Math.round(state.athlete.altitudeAdjustmentFactor * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_ATHLETE",
                      athlete: {
                        altitudeAdjustmentFactor:
                          (parseInt(e.target.value) || 0) / 100,
                      },
                    })
                  }
                  placeholder="20"
                  min={0}
                  max={40}
                  className="w-24"
                />
                <span className="text-sm text-brand-navy-600">
                  FTP at altitude: {Math.round(adjustedFTP)}w
                </span>
              </div>
              <p className="text-xs text-brand-navy-500">
                Typical high-altitude adjustment: 15-25%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Power Targets Table */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium text-brand-navy-900">
          <Zap className="h-5 w-5 text-brand-sky-500" />
          Power Targets
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-brand-navy-200">
                <th className="py-3 px-4 text-left text-sm font-medium text-brand-navy-600">
                  Effort Level
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-brand-navy-600">
                  Target NP
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-brand-navy-600">
                  <span className="flex items-center justify-end gap-1">
                    <Mountain className="h-3.5 w-3.5" />
                    Climb
                  </span>
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-brand-navy-600">
                  Flat
                </th>
              </tr>
            </thead>
            <tbody>
              {powerTargets.map((row) => (
                <tr
                  key={row.level}
                  className="border-b border-brand-navy-100 hover:bg-brand-navy-50"
                >
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 rounded text-sm font-medium capitalize",
                        row.level === "safe" && "bg-emerald-100 text-emerald-700",
                        row.level === "tempo" && "bg-amber-100 text-amber-700",
                        row.level === "pushing" && "bg-red-100 text-red-700"
                      )}
                    >
                      {row.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-brand-navy-900">
                    {row.targetNP}w
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-brand-navy-900">
                    {row.climbPower}w
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-brand-navy-900">
                    {row.flatPower}w
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-brand-navy-500">
          <p>
            <strong>Safe:</strong> Conservative pace, prioritizes finishing strong
          </p>
          <p>
            <strong>Tempo:</strong> Sustainable race pace, balanced effort
          </p>
          <p>
            <strong>Pushing:</strong> Aggressive pace, requires optimal conditions
          </p>
        </div>
      </div>
    </div>
  );
}
