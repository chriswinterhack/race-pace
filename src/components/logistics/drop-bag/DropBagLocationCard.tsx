"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Backpack, Clock, Plus, Package, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SortableItem } from "./SortableItem";
import type { DropBagLocation, DropBagItem, DropBagPass } from "@/types/logistics";

interface DropBagLocationCardProps {
  location: DropBagLocation;
  locationIndex: number;
  arrivalTime: string | null;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<DropBagItem>) => void;
}

// Helper to format pass direction
function formatDirection(direction: DropBagPass["direction"]): string {
  switch (direction) {
    case "outbound":
      return "Outbound";
    case "inbound":
      return "Inbound";
    default:
      return "";
  }
}

export function DropBagLocationCard({
  location,
  locationIndex,
  arrivalTime,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: DropBagLocationCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `location-${location.drop_bag_name}`,
    data: {
      type: "location",
      locationIndex,
      dropBagName: location.drop_bag_name,
    },
  });

  const itemCount = location.items.length;
  const hasCritical = location.items.some((i) => i.is_critical);
  const itemIds = location.items.map((item) => item.id);

  // Check if this is a multi-pass location (out-and-back)
  const isMultiPass = location.passes.length > 1;

  return (
    <div className="flex items-start gap-4">
      {/* Timeline Node */}
      <div className={cn(
        "relative z-10 h-12 w-12 rounded-full flex items-center justify-center shadow-lg",
        isMultiPass ? "bg-gradient-to-br from-brand-sky-500 to-violet-500" : "bg-brand-sky-500"
      )}>
        {isMultiPass ? (
          <RotateCcw className="h-5 w-5 text-white" />
        ) : (
          <Backpack className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Location Card */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-white border rounded-xl p-4 shadow-sm transition-all",
          isOver
            ? "border-brand-sky-400 bg-brand-sky-50 shadow-md ring-2 ring-brand-sky-200"
            : "border-brand-navy-100 hover:shadow-md"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-brand-navy-900">{location.drop_bag_name}</h4>
              {isMultiPass && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                  Out & Back
                </span>
              )}
            </div>

            {/* Single pass display */}
            {!isMultiPass && (
              <div className="flex items-center gap-3 mt-1 text-sm text-brand-navy-500">
                <span>Mile {location.mile}</span>
                {arrivalTime && (
                  <>
                    <span className="text-brand-navy-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ETA {arrivalTime}
                    </span>
                  </>
                )}
                {location.cutoff_time && (
                  <>
                    <span className="text-brand-navy-300">•</span>
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Cutoff: {location.cutoff_time}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Multi-pass display */}
            {isMultiPass && (
              <div className="mt-2 space-y-1">
                {location.passes.map((pass, idx) => (
                  <div
                    key={pass.mile}
                    className={cn(
                      "flex items-center gap-2 text-sm px-2 py-1 rounded-lg",
                      pass.direction === "outbound" ? "bg-blue-50" : "bg-amber-50"
                    )}
                  >
                    <span className={cn(
                      "px-1.5 py-0.5 text-xs font-medium rounded",
                      pass.direction === "outbound"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {formatDirection(pass.direction) || `Pass ${idx + 1}`}
                    </span>
                    <span className="text-brand-navy-600">Mile {pass.mile}</span>
                    {pass.arrival_time && (
                      <>
                        <ArrowRight className="h-3 w-3 text-brand-navy-300" />
                        <span className="flex items-center gap-1 text-brand-navy-500">
                          <Clock className="h-3 w-3" />
                          {pass.arrival_time}
                        </span>
                      </>
                    )}
                    {pass.cutoff_time && (
                      <span className="text-amber-600 flex items-center gap-1 ml-auto">
                        <AlertTriangle className="h-3 w-3" />
                        {pass.cutoff_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddItem}
            className="text-brand-sky-600 hover:text-brand-sky-700 hover:bg-brand-sky-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Notes */}
        {location.notes && (
          <p className="mt-2 text-sm text-brand-navy-500 italic">{location.notes}</p>
        )}

        {/* Supplies Available at Aid Station */}
        {location.supplies && location.supplies.length > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-medium text-emerald-700 mb-2">
              Available at Aid Station
            </p>
            <div className="flex flex-wrap gap-1.5">
              {location.supplies.map((supply, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700"
                >
                  {supply}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mt-4">
          {itemCount > 0 ? (
            <>
              {/* Summary */}
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-brand-navy-400" />
                <span className="text-sm font-medium text-brand-navy-600">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
                {hasCritical && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Has Critical
                  </span>
                )}
              </div>

              {/* Sortable Items List */}
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {location.items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      locationIndex={locationIndex}
                      onRemove={() => onRemoveItem(item.id)}
                      onToggleCritical={() =>
                        onUpdateItem(item.id, { is_critical: !item.is_critical })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </>
          ) : (
            <div className="py-4 text-center border-t border-dashed border-brand-navy-200">
              <p className="text-sm text-brand-navy-400">
                {isOver ? "Drop item here" : "No items added yet"}
              </p>
              {!isOver && (
                <p className="text-xs text-brand-navy-300 mt-1">
                  Click &quot;Add Item&quot; or drag items here
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
