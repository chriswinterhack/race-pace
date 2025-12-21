"use client";

import { useState } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { formatDuration, parseDuration } from "@/lib/calculations";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  race_distance: {
    distance_miles: number;
    gpx_distance_miles: number | null;
  };
}

interface GoalSectionProps {
  plan: RacePlan;
  onUpdate: (updates: Partial<RacePlan>) => Promise<boolean>;
}

export function GoalSection({ plan, onUpdate }: GoalSectionProps) {
  const [goalTime, setGoalTime] = useState(
    plan.goal_time_minutes ? formatDuration(plan.goal_time_minutes) : ""
  );
  const [saving, setSaving] = useState(false);

  // Use GPX distance if available, otherwise fall back to nominal distance
  const effectiveDistance = plan.race_distance.gpx_distance_miles ?? plan.race_distance.distance_miles;

  const handleSave = async () => {
    setSaving(true);
    const minutes = parseDuration(goalTime);
    if (minutes > 0) {
      await onUpdate({ goal_time_minutes: Math.round(minutes) } as Partial<RacePlan>);
    }
    setSaving(false);
  };

  const goalMinutes = parseDuration(goalTime);
  const avgSpeed = goalMinutes > 0
    ? (effectiveDistance / (goalMinutes / 60)).toFixed(1)
    : null;

  const pacePerMile = goalMinutes > 0
    ? formatDuration(goalMinutes / effectiveDistance)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">Goal Time</h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Set your target finish time for the race
        </p>
      </div>

      <div className="max-w-md space-y-4">
        <div>
          <Label htmlFor="goalTime">Target Finish Time</Label>
          <div className="mt-1 flex gap-3">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
              <Input
                id="goalTime"
                value={goalTime}
                onChange={(e) => setGoalTime(e.target.value)}
                placeholder="HH:MM:SS"
                className="pl-10 font-mono"
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !goalMinutes}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-xs text-brand-navy-500">
            Enter time as HH:MM:SS or HH:MM
          </p>
        </div>

        {goalMinutes > 0 && (
          <div className="p-4 rounded-lg bg-brand-navy-50 space-y-3">
            <div className="flex justify-between">
              <span className="text-brand-navy-600">Distance</span>
              <span className="font-medium text-brand-navy-900">
                {effectiveDistance} miles
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-600">Average Speed</span>
              <span className="font-medium text-brand-navy-900">
                {avgSpeed} mph
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-navy-600">Pace per Mile</span>
              <span className="font-medium font-mono text-brand-navy-900">
                {pacePerMile}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
