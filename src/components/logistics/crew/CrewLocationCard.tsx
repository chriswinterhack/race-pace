"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  Car,
  Bus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  AlertCircle,
  Utensils,
  Shirt,
  Brain,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CrewLocationInstructions } from "@/types/logistics";

interface CrewLocationCardProps {
  name: string;
  mile: number;
  mileIn?: number;
  accessType?: "unlimited" | "limited" | "reserved";
  parkingInfo?: string;
  shuttleInfo?: string;
  notes?: string;
  arrivalTime: string | null;
  instructions?: CrewLocationInstructions;
  onUpdateInstructions: (updates: Partial<CrewLocationInstructions>) => void;
}

export function CrewLocationCard({
  name,
  mile,
  mileIn,
  accessType,
  parkingInfo,
  shuttleInfo,
  notes,
  arrivalTime,
  instructions,
  onUpdateInstructions,
}: CrewLocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasInstructions = instructions && (
    instructions.priority_actions ||
    instructions.nutrition_notes ||
    instructions.equipment_changes ||
    instructions.mental_cues ||
    instructions.parking_spot
  );

  return (
    <div className="flex items-start gap-4">
      {/* Timeline Node */}
      <div className={cn(
        "relative z-10 h-12 w-12 rounded-full flex items-center justify-center shadow-lg",
        accessType === "unlimited"
          ? "bg-emerald-500"
          : accessType === "limited"
            ? "bg-amber-500"
            : "bg-brand-sky-500"
      )}>
        <MapPin className="h-5 w-5 text-white" />
      </div>

      {/* Location Card */}
      <div className="flex-1 bg-white border border-brand-navy-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-brand-navy-900">{name}</h4>
                {accessType && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      accessType === "unlimited"
                        ? "bg-green-100 text-green-700"
                        : accessType === "limited"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    )}
                  >
                    {accessType === "unlimited" ? "Full Access" : accessType === "limited" ? "Limited" : "Reserved"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-brand-navy-500">
                <span>Mile {mile}</span>
                {mileIn && mileIn !== mile && <span className="text-brand-navy-400">→ {mileIn}</span>}
                {arrivalTime && (
                  <>
                    <span className="text-brand-navy-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ETA {arrivalTime}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-brand-navy-500"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Info */}
          {(parkingInfo || shuttleInfo) && (
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              {parkingInfo && (
                <span className="flex items-center gap-1 text-brand-navy-600">
                  <Car className="h-3.5 w-3.5 text-brand-navy-400" />
                  {parkingInfo}
                </span>
              )}
              {shuttleInfo && (
                <span className="flex items-center gap-1 text-brand-navy-600">
                  <Bus className="h-3.5 w-3.5 text-brand-navy-400" />
                  {shuttleInfo}
                </span>
              )}
            </div>
          )}

          {notes && (
            <p className="mt-2 text-sm text-brand-navy-500 italic">{notes}</p>
          )}

          {/* Instructions Preview */}
          {hasInstructions && !isExpanded && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Has Instructions
              </span>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-brand-navy-100 p-4 bg-brand-navy-50/50">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-brand-navy-800">Crew Instructions</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* Stop Duration */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-navy-400" />
                    Planned Stop (minutes)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={instructions?.planned_stop_duration_minutes || ""}
                    onChange={(e) => onUpdateInstructions({
                      planned_stop_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="e.g., 5"
                    className="mt-1"
                  />
                </div>

                {/* Priority Actions */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Priority Actions
                  </label>
                  <textarea
                    value={instructions?.priority_actions || ""}
                    onChange={(e) => onUpdateInstructions({ priority_actions: e.target.value })}
                    placeholder="What should crew do FIRST when athlete arrives?"
                    className="mt-1 w-full px-3 py-2 border border-brand-navy-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-sky-500"
                    rows={2}
                  />
                </div>

                {/* Nutrition Notes */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-orange-500" />
                    Nutrition/Hydration Notes
                  </label>
                  <textarea
                    value={instructions?.nutrition_notes || ""}
                    onChange={(e) => onUpdateInstructions({ nutrition_notes: e.target.value })}
                    placeholder="What food/drink to have ready?"
                    className="mt-1 w-full px-3 py-2 border border-brand-navy-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-sky-500"
                    rows={2}
                  />
                </div>

                {/* Equipment Changes */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-blue-500" />
                    Equipment Changes
                  </label>
                  <textarea
                    value={instructions?.equipment_changes || ""}
                    onChange={(e) => onUpdateInstructions({ equipment_changes: e.target.value })}
                    placeholder="Any gear to swap or add?"
                    className="mt-1 w-full px-3 py-2 border border-brand-navy-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-sky-500"
                    rows={2}
                  />
                </div>

                {/* Mental Cues */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Mental Cues
                  </label>
                  <textarea
                    value={instructions?.mental_cues || ""}
                    onChange={(e) => onUpdateInstructions({ mental_cues: e.target.value })}
                    placeholder="Encouraging words or reminders"
                    className="mt-1 w-full px-3 py-2 border border-brand-navy-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-sky-500"
                    rows={2}
                  />
                </div>

                {/* Parking Spot */}
                <div>
                  <label className="text-sm font-medium text-brand-navy-700 flex items-center gap-2">
                    <Car className="h-4 w-4 text-brand-navy-400" />
                    Crew Parking Spot
                  </label>
                  <Input
                    value={instructions?.parking_spot || ""}
                    onChange={(e) => onUpdateInstructions({ parking_spot: e.target.value })}
                    placeholder="Where will crew park/set up?"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {instructions?.planned_stop_duration_minutes && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-brand-navy-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Planned Stop</p>
                      <p className="text-sm text-brand-navy-600">{instructions.planned_stop_duration_minutes} minutes</p>
                    </div>
                  </div>
                )}

                {instructions?.priority_actions && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Priority Actions</p>
                      <p className="text-sm text-brand-navy-600 whitespace-pre-wrap">{instructions.priority_actions}</p>
                    </div>
                  </div>
                )}

                {instructions?.nutrition_notes && (
                  <div className="flex items-start gap-2">
                    <Utensils className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Nutrition/Hydration</p>
                      <p className="text-sm text-brand-navy-600 whitespace-pre-wrap">{instructions.nutrition_notes}</p>
                    </div>
                  </div>
                )}

                {instructions?.equipment_changes && (
                  <div className="flex items-start gap-2">
                    <Shirt className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Equipment Changes</p>
                      <p className="text-sm text-brand-navy-600 whitespace-pre-wrap">{instructions.equipment_changes}</p>
                    </div>
                  </div>
                )}

                {instructions?.mental_cues && (
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Mental Cues</p>
                      <p className="text-sm text-brand-navy-600 whitespace-pre-wrap">{instructions.mental_cues}</p>
                    </div>
                  </div>
                )}

                {instructions?.parking_spot && (
                  <div className="flex items-start gap-2">
                    <Car className="h-4 w-4 text-brand-navy-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-navy-700">Parking Spot</p>
                      <p className="text-sm text-brand-navy-600">{instructions.parking_spot}</p>
                    </div>
                  </div>
                )}

                {!hasInstructions && (
                  <p className="text-sm text-brand-navy-400 italic">
                    No instructions set. Click Edit to add crew instructions for this location.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
