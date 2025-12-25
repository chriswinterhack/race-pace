import { Plus, TrendingUp, Users, Package } from "lucide-react";
import { Button } from "@/components/ui";
import type { GearAggregation } from "./types";

interface GearPickerWithInsightsProps<T extends { id: string; brand: string; model: string }> {
  items: T[];
  communityItems: GearAggregation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  emptyMessage: string;
}

export function GearPickerWithInsights<T extends { id: string; brand: string; model: string }>({
  items,
  communityItems,
  onAddNew,
  renderItem,
  getItemKey,
}: GearPickerWithInsightsProps<T>) {
  const getPopularity = (item: T) => {
    const key = getItemKey(item);
    return communityItems.find((c) => `${c.brand}|${c.model}` === key);
  };

  if (items.length === 0) {
    return <EmptyInventoryState onAdd={onAddNew} />;
  }

  const sortedItems = [...items].sort((a, b) => {
    const popA = getPopularity(a);
    const popB = getPopularity(b);
    return (popB?.count || 0) - (popA?.count || 0);
  });

  return (
    <div className="space-y-4">
      {communityItems.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">
            Items used by other riders are marked with popularity
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sortedItems.map((item) => {
          const popularity = getPopularity(item);
          return (
            <div key={item.id} className="relative">
              {popularity && popularity.count > 0 && (
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                  <Users className="h-3 w-3" />
                  {popularity.count}
                </div>
              )}
              {renderItem(item)}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-brand-navy-100">
        <Button variant="outline" onClick={onAddNew} className="w-full gap-1.5">
          <Plus className="h-4 w-4" />
          Add New to Inventory
        </Button>
      </div>
    </div>
  );
}

interface EmptyInventoryStateProps {
  onAdd: () => void;
}

export function EmptyInventoryState({ onAdd }: EmptyInventoryStateProps) {
  return (
    <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
      <div className="mx-auto w-12 h-12 rounded-xl bg-brand-navy-100 flex items-center justify-center mb-3">
        <Package className="h-6 w-6 text-brand-navy-400" />
      </div>
      <p className="text-brand-navy-600 mb-4">Your inventory is empty</p>
      <Button onClick={onAdd} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Add Your First Item
      </Button>
    </div>
  );
}
