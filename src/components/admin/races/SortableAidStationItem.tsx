"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Droplet, Milestone, Backpack, Users } from "lucide-react";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AidStation, PassDirection } from "@/types/admin";

interface SortableAidStationItemProps {
  station: AidStation & { id: string };
  index: number;
  onUpdate: (updates: Partial<AidStation>) => void;
  onRemove: () => void;
}

export function SortableAidStationItem({
  station,
  index,
  onUpdate,
  onRemove,
}: SortableAidStationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: station.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Default to aid_station for backward compatibility
  const stationType = station.type || "aid_station";
  const isAidStation = stationType === "aid_station";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 rounded-lg border",
        isAidStation
          ? "bg-emerald-50 border-emerald-200"
          : "bg-brand-navy-50 border-brand-navy-200",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1.5 text-brand-navy-400 hover:text-brand-navy-600 cursor-grab active:cursor-grabbing rounded hover:bg-brand-navy-100 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
          isAidStation
            ? "bg-emerald-200 text-emerald-700"
            : "bg-brand-sky-100 text-brand-sky-700"
        )}>
          {index + 1}
        </div>
        <div className="flex-1 space-y-3">
          {/* Type Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ type: "aid_station" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                isAidStation
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-brand-navy-200 text-brand-navy-600 hover:border-brand-navy-300"
              )}
            >
              <Droplet className="h-3.5 w-3.5" />
              Aid Station
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ type: "checkpoint" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                !isAidStation
                  ? "bg-brand-sky-600 text-white"
                  : "bg-white border border-brand-navy-200 text-brand-navy-600 hover:border-brand-navy-300"
              )}
            >
              <Milestone className="h-3.5 w-3.5" />
              Checkpoint
            </button>
          </div>
          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={station.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder={isAidStation ? "e.g., Pipeline Aid Station" : "e.g., Start of Climb 1"}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mile Marker *</Label>
              <Input
                type="number"
                step="0.1"
                value={station.mile || ""}
                onChange={(e) =>
                  onUpdate({ mile: parseFloat(e.target.value) || 0 })
                }
                placeholder="24.5"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cutoff Time</Label>
              <Input
                type="time"
                value={station.cutoff_time || ""}
                onChange={(e) => onUpdate({ cutoff_time: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
          {/* Supplies - Only show for aid stations */}
          {isAidStation && (
            <div className="space-y-1">
              <Label className="text-xs">Supplies Available</Label>
              <Input
                value={(station.supplies || []).join(", ")}
                onChange={(e) => {
                  const supplies = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  onUpdate({ supplies });
                }}
                placeholder="e.g., Water, Gels, Bananas, Pickle Juice, Coke"
                className="h-9 text-sm"
              />
              <p className="text-xs text-brand-navy-400">Comma-separated list</p>
            </div>
          )}
          {/* Logistics Flags - Only show for aid stations */}
          {isAidStation && (
            <div className="space-y-3 pt-2 mt-2 border-t border-emerald-200/50">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={station.is_drop_bag || false}
                    onChange={(e) => onUpdate({ is_drop_bag: e.target.checked })}
                    className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-emerald-700 group-hover:text-emerald-800">
                    <Backpack className="h-4 w-4" />
                    Drop Bag Location
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={station.is_crew_access || false}
                    onChange={(e) => onUpdate({ is_crew_access: e.target.checked })}
                    className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-emerald-700 group-hover:text-emerald-800">
                    <Users className="h-4 w-4" />
                    Crew Access
                  </span>
                </label>
              </div>
              {/* Linked Drop Bag Fields - Only show when is_drop_bag is checked */}
              {station.is_drop_bag && (
                <div className="grid gap-3 sm:grid-cols-2 p-3 bg-emerald-100/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-700">Drop Bag Name (optional)</Label>
                    <Input
                      value={station.drop_bag_name || ""}
                      onChange={(e) => onUpdate({ drop_bag_name: e.target.value || undefined })}
                      placeholder="Leave blank to auto-group"
                      className="h-8 text-sm bg-white"
                    />
                    <p className="text-xs text-emerald-600">
                      Leave blank! Auto-groups &quot;Name (Outbound)&quot; with &quot;Name (Inbound)&quot;
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-emerald-700">Pass Direction</Label>
                    <select
                      value={station.pass_direction || "single"}
                      onChange={(e) => onUpdate({ pass_direction: e.target.value as PassDirection })}
                      className="h-8 w-full text-sm rounded-md border border-brand-navy-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="single">Single Pass</option>
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
