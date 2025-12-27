"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Flag, X, GripVertical, Loader2, Droplet, Milestone } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import type { AidStation } from "@/types/admin";
import { SortableAidStationItem } from "./SortableAidStationItem";

interface AidStationsModalProps {
  distanceId: string;
  distanceName: string;
  aidStations: AidStation[];
  onClose: () => void;
  onSaved: () => void;
}

export function AidStationsModal({
  distanceId,
  distanceName,
  aidStations: initialStations,
  onClose,
  onSaved,
}: AidStationsModalProps) {
  // Add unique IDs to stations for drag and drop
  const [stations, setStations] = useState<(AidStation & { id: string })[]>(
    initialStations.map((s, i) => ({ ...s, id: s.id || `station-${i}-${Date.now()}` }))
  );
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStation = (type: "aid_station" | "checkpoint" = "aid_station") => {
    setStations([
      ...stations,
      {
        id: `station-new-${Date.now()}`,
        name: "",
        mile: 0,
        cutoff_time: "",
        type,
        is_drop_bag: false,
        is_crew_access: false,
      },
    ]);
  };

  const updateStation = (id: string, updates: Partial<AidStation>) => {
    setStations(
      stations.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeStation = (id: string) => {
    setStations(stations.filter((s) => s.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStations((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Clean stations for saving (remove empty ones, strip internal IDs)
    const cleanedStations = stations
      .filter((s) => s.name && s.mile >= 0)
      .map(({ name, mile, supplies, cutoff_time, type, is_drop_bag, is_crew_access, drop_bag_name, pass_direction, drop_bag_notes, crew_notes }) => ({
        name,
        mile,
        supplies: supplies || [],
        cutoff_time: cutoff_time || null,
        type: type || "aid_station",
        is_drop_bag: is_drop_bag || false,
        is_crew_access: is_crew_access || false,
        drop_bag_name: drop_bag_name || null,
        pass_direction: pass_direction || null,
        drop_bag_notes: drop_bag_notes || null,
        crew_notes: crew_notes || null,
      }));

    try {
      const response = await fetch("/api/admin/aid-stations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceId,
          aidStations: cleanedStations,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to save aid stations");
        setSaving(false);
        return;
      }

      toast.success("Aid stations saved!");
      onSaved();
    } catch {
      toast.error("Failed to save aid stations");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
                Aid Stations / Checkpoints
              </h2>
              <p className="mt-1 text-sm text-brand-navy-600">
                Manage checkpoints for {distanceName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-navy-400 hover:text-brand-navy-600 hover:bg-brand-navy-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-xs text-brand-navy-500 flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            Drag to reorder checkpoints
          </p>

          <div className="mt-4 space-y-4">
            {stations.length === 0 ? (
              <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
                <Flag className="h-10 w-10 mx-auto text-brand-navy-300 mb-3" />
                <p className="text-brand-navy-600">No aid stations or checkpoints added yet</p>
                <p className="text-sm text-brand-navy-500 mt-1">
                  Add aid stations (resupply points) and checkpoints (climb starts, landmarks) to help athletes plan their race
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stations.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {stations.map((station, index) => (
                      <SortableAidStationItem
                        key={station.id}
                        station={station}
                        index={index}
                        onUpdate={(updates) => updateStation(station.id, updates)}
                        onRemove={() => removeStation(station.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => addStation("aid_station")}
                className="flex-1 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
              >
                <Droplet className="h-4 w-4 mr-2" />
                Add Aid Station
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addStation("checkpoint")}
                className="flex-1 border-dashed"
              >
                <Milestone className="h-4 w-4 mr-2" />
                Add Checkpoint
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-brand-navy-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
