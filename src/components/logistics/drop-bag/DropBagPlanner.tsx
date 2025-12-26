"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Backpack,
  Save,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLogisticsPlannerStore } from "../stores/logisticsPlannerStore";
import { DropBagLocationCard } from "./DropBagLocationCard";
import { ItemPicker } from "./ItemPicker";
import { DraggableItem } from "./DraggableItem";
import type { DropBagItem, DropBagLocation } from "@/types/logistics";

interface DropBagPlannerProps {
  racePlanId: string;
  locations: DropBagLocation[];
  distanceMiles: number;
  startTime?: string | null; // Format: "4:00 AM"
  finishTime?: string | null; // Format: "10:30 PM"
  getArrivalTime: (mile: number) => string | null;
  className?: string;
}

export function DropBagPlanner({
  racePlanId,
  locations,
  distanceMiles,
  startTime,
  finishTime,
  getArrivalTime,
  className,
}: DropBagPlannerProps) {
  const [activeItem, setActiveItem] = useState<DropBagItem | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    dropBagLocations,
    setDropBagLocations,
    dropBagPlanId,
    setDropBagPlanId,
    addItemToDropBag,
    removeItemFromDropBag,
    updateDropBagItem,
    reorderDropBagItems,
    moveItemBetweenDropBagLocations,
    setDragging,
    hasUnsavedChanges,
    markSaved,
  } = useLogisticsPlannerStore();

  const supabase = createClient();

  // Initialize with provided locations
  useEffect(() => {
    if (locations.length > 0 && dropBagLocations.length === 0) {
      setDropBagLocations(locations);
    }
  }, [locations, dropBagLocations.length, setDropBagLocations]);

  // Drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "item") {
      setActiveItem(activeData.item as DropBagItem);
      setDragging(true);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setDragging(false);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping item on a location
    if (activeData?.type === "item" && overData?.type === "location") {
      const fromLocationIndex = activeData.locationIndex as number;
      const toLocationIndex = overData.locationIndex as number;
      const itemId = activeData.item.id as string;

      if (fromLocationIndex !== toLocationIndex) {
        moveItemBetweenDropBagLocations(fromLocationIndex, toLocationIndex, itemId);
      }
    }

    // Handle reordering within a location
    if (activeData?.type === "item" && overData?.type === "item") {
      const fromLocationIndex = activeData.locationIndex as number;
      const toLocationIndex = overData.locationIndex as number;

      if (fromLocationIndex === toLocationIndex) {
        const fromIndex = activeData.index as number;
        const toIndex = overData.index as number;
        if (fromIndex !== toIndex) {
          reorderDropBagItems(fromLocationIndex, fromIndex, toIndex);
        }
      } else {
        // Moving to different location
        moveItemBetweenDropBagLocations(fromLocationIndex, toLocationIndex, activeData.item.id);
      }
    }
  };

  // Save to database
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save");
        return;
      }

      let planId = dropBagPlanId;

      // Create plan if it doesn't exist
      if (!planId) {
        const { data: newPlan, error: planError } = await supabase
          .from("user_drop_bag_plans")
          .insert({
            user_id: user.id,
            race_plan_id: racePlanId,
          })
          .select("id")
          .single();

        if (planError) {
          console.error("Error creating drop bag plan:", planError);
          throw planError;
        }
        planId = newPlan.id;
        setDropBagPlanId(planId);
      }

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("drop_bag_items")
        .delete()
        .eq("drop_bag_plan_id", planId);

      if (deleteError) {
        console.error("Error deleting existing items:", deleteError);
        throw deleteError;
      }

      // Insert all items - planId is guaranteed to be non-null at this point
      if (!planId) throw new Error("Plan ID is required");

      // Build items array with proper field handling
      const allItems: Record<string, unknown>[] = [];
      for (const location of dropBagLocations) {
        for (let i = 0; i < location.items.length; i++) {
          const item = location.items[i];
          if (!item) continue;

          // Build the item object based on source_type
          const dbItem: Record<string, unknown> = {
            drop_bag_plan_id: planId,
            location_mile: location.passes?.[0]?.mile ?? location.mile ?? 0,
            location_name: location.drop_bag_name || location.name || "Unknown",
            source_type: item.source_type,
            quantity: item.quantity || 1,
            is_critical: item.is_critical || false,
            sort_order: i,
          };

          // Add fields based on source type
          if (item.source_type === "gear_inventory") {
            dbItem.gear_type = item.gear_type;
            dbItem.gear_id = item.gear_id;
          } else {
            // Custom item
            dbItem.custom_name = item.custom_name;
            dbItem.custom_category = item.custom_category;
          }

          // Add optional notes if present
          if (item.notes) {
            dbItem.notes = item.notes;
          }

          allItems.push(dbItem);
        }
      }

      if (allItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("drop_bag_items")
          .insert(allItems);

        if (itemsError) {
          console.error("Error inserting items:", itemsError);
          console.error("Items that failed:", JSON.stringify(allItems, null, 2));
          throw itemsError;
        }
      }

      markSaved();
      toast.success("Drop bag plan saved");
    } catch (err) {
      console.error("Error saving drop bag plan:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [dropBagPlanId, dropBagLocations, racePlanId, setDropBagPlanId, markSaved, supabase]);

  // Open item picker for a location
  const openItemPicker = (locationIndex: number) => {
    setSelectedLocationIndex(locationIndex);
    setShowItemPicker(true);
  };

  // Handle adding item from picker
  const handleAddItem = (item: Omit<DropBagItem, "id" | "drop_bag_plan_id" | "sort_order">) => {
    if (selectedLocationIndex !== null) {
      addItemToDropBag(selectedLocationIndex, item);
    }
    setShowItemPicker(false);
    setSelectedLocationIndex(null);
  };

  if (dropBagLocations.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-brand-navy-50 rounded-xl border border-dashed border-brand-navy-200">
        <Backpack className="h-12 w-12 text-brand-navy-300 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-brand-navy-900">No Drop Bag Locations</h4>
        <p className="mt-2 text-brand-navy-600">
          This race doesn&apos;t have designated drop bag locations yet.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("space-y-6", className)}>
        {/* Header with Save Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-navy-900">Drop Bag Plan</h3>
            <p className="text-sm text-brand-navy-500">
              Drag items between locations or click Add Item to add new items
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-brand-sky-500 hover:bg-brand-sky-600"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Plan
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Course Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-sky-400 via-brand-sky-300 to-brand-sky-200" />

          <div className="space-y-4">
            {/* Start */}
            <div className="flex items-center gap-4">
              <div className="relative z-10 h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-brand-navy-900">Start</p>
                <p className="text-sm text-brand-navy-500">
                  Mile 0{startTime && <span className="ml-2">• {startTime}</span>}
                </p>
              </div>
            </div>

            {/* Drop Bag Locations */}
            {dropBagLocations.map((location, index) => (
              <DropBagLocationCard
                key={location.drop_bag_name}
                location={location}
                locationIndex={index}
                arrivalTime={getArrivalTime(location.passes[0]?.mile ?? location.mile)}
                onAddItem={() => openItemPicker(index)}
                onRemoveItem={(itemId) => removeItemFromDropBag(index, itemId)}
                onUpdateItem={(itemId, updates) => updateDropBagItem(index, itemId, updates)}
              />
            ))}

            {/* Finish */}
            <div className="flex items-center gap-4">
              <div className="relative z-10 h-12 w-12 rounded-full bg-brand-navy-900 flex items-center justify-center shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-brand-navy-900">Finish</p>
                <p className="text-sm text-brand-navy-500">
                  Mile {distanceMiles}{finishTime && <span className="ml-2">• {finishTime}</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <DraggableItem item={activeItem} isDragging />
        )}
      </DragOverlay>

      {/* Item Picker Modal */}
      {showItemPicker && selectedLocationIndex !== null && (
        <ItemPicker
          locationName={dropBagLocations[selectedLocationIndex]?.drop_bag_name || ""}
          locationMile={dropBagLocations[selectedLocationIndex]?.passes[0]?.mile ?? dropBagLocations[selectedLocationIndex]?.mile ?? 0}
          onAdd={handleAddItem}
          onClose={() => {
            setShowItemPicker(false);
            setSelectedLocationIndex(null);
          }}
        />
      )}
    </DndContext>
  );
}
