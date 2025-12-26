"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Plus,
  Package,
  Shirt,
  Wrench,
  Zap,
  Heart,
  MoreHorizontal,
  Star,
  Loader2,
  Clock,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLogisticsPlannerStore } from "../stores/logisticsPlannerStore";
import type {
  DropBagItem,
  CustomItemCategory,
  GearItemType,
  QuickAddItem,
} from "@/types/logistics";

interface UserCustomItem {
  id: string;
  name: string;
  category: CustomItemCategory;
  default_quantity: number;
  use_count: number;
}

interface ItemPickerProps {
  locationName: string;
  locationMile: number;
  onAdd: (item: Omit<DropBagItem, "id" | "drop_bag_plan_id" | "sort_order">) => void;
  onClose: () => void;
}

type PickerTab = "quick" | "gear" | "custom";

const CATEGORY_ICONS: Record<CustomItemCategory, React.ElementType> = {
  nutrition: Package,
  clothing: Shirt,
  repair: Wrench,
  electronics: Zap,
  medical: Heart,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<CustomItemCategory, string> = {
  nutrition: "bg-orange-100 text-orange-700 border-orange-200",
  clothing: "bg-blue-100 text-blue-700 border-blue-200",
  repair: "bg-gray-100 text-gray-700 border-gray-200",
  electronics: "bg-purple-100 text-purple-700 border-purple-200",
  medical: "bg-red-100 text-red-700 border-red-200",
  other: "bg-brand-navy-100 text-brand-navy-700 border-brand-navy-200",
};

// Common drop bag items for quick add
const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { name: "Extra socks", category: "clothing" },
  { name: "Arm warmers", category: "clothing" },
  { name: "Leg warmers", category: "clothing" },
  { name: "Rain jacket", category: "clothing" },
  { name: "Gloves", category: "clothing" },
  { name: "Spare tube", category: "repair" },
  { name: "CO2 cartridge", category: "repair" },
  { name: "Chain link", category: "repair" },
  { name: "Spare battery", category: "electronics" },
  { name: "Phone charger", category: "electronics" },
  { name: "Head lamp", category: "electronics" },
  { name: "Tail light", category: "electronics" },
  { name: "Gels", category: "nutrition" },
  { name: "Bars", category: "nutrition" },
  { name: "Drink mix", category: "nutrition" },
  { name: "Pickle juice", category: "nutrition" },
  { name: "Salt tabs", category: "nutrition" },
  { name: "Caffeine pills", category: "nutrition" },
  { name: "Ibuprofen", category: "medical" },
  { name: "Blister kit", category: "medical" },
  { name: "Anti-chafe cream", category: "medical" },
  { name: "Sunscreen", category: "other" },
  { name: "Lip balm", category: "other" },
];

export function ItemPicker({
  locationName,
  locationMile,
  onAdd,
  onClose,
}: ItemPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("quick");
  const [searchQuery, setSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<CustomItemCategory>("other");
  const [quantity, setQuantity] = useState(1);
  const [isCritical, setIsCritical] = useState(false);
  const [loadingGear, setLoadingGear] = useState(false);
  const [userCustomItems, setUserCustomItems] = useState<UserCustomItem[]>([]);
  const [loadingCustomItems, setLoadingCustomItems] = useState(true);

  const { gearInventory, setGearInventory } = useLogisticsPlannerStore();
  const supabase = createClient();

  // Load user's custom items on mount
  useEffect(() => {
    loadUserCustomItems();
  }, []);

  // Load gear inventory if not already loaded
  useEffect(() => {
    if (activeTab === "gear" && !gearInventory) {
      loadGearInventory();
    }
  }, [activeTab, gearInventory]);

  async function loadUserCustomItems() {
    setLoadingCustomItems(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_custom_items")
        .select("*")
        .eq("user_id", user.id)
        .order("use_count", { ascending: false })
        .limit(20);

      if (data) {
        setUserCustomItems(data as UserCustomItem[]);
      }
    } catch (err) {
      console.error("Error loading custom items:", err);
    } finally {
      setLoadingCustomItems(false);
    }
  }

  // Save custom item to user's list and increment use count
  const saveCustomItem = useCallback(async (name: string, category: CustomItemCategory, qty: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to upsert - if exists, increment use_count
      const { data: existing } = await supabase
        .from("user_custom_items")
        .select("id, use_count")
        .eq("user_id", user.id)
        .eq("name", name)
        .single();

      if (existing) {
        // Increment use count
        await supabase
          .from("user_custom_items")
          .update({ use_count: existing.use_count + 1 })
          .eq("id", existing.id);
      } else {
        // Insert new item
        await supabase
          .from("user_custom_items")
          .insert({
            user_id: user.id,
            name,
            category,
            default_quantity: qty,
            use_count: 1,
          });
      }
    } catch (err) {
      // Silently fail - this is not critical
      console.error("Error saving custom item:", err);
    }
  }, [supabase]);

  async function loadGearInventory() {
    setLoadingGear(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all gear types
      const [
        { data: clothing },
        { data: repair_kits },
        { data: hydration_packs },
        { data: bags },
        { data: shoes },
        { data: tires },
        { data: bikes },
      ] = await Promise.all([
        supabase.from("user_clothing").select("*").eq("user_id", user.id),
        supabase.from("user_repair_kits").select("*").eq("user_id", user.id),
        supabase.from("user_hydration_packs").select("*").eq("user_id", user.id),
        supabase.from("user_bags").select("*").eq("user_id", user.id),
        supabase.from("user_shoes").select("*").eq("user_id", user.id),
        supabase.from("user_tires").select("*").eq("user_id", user.id),
        supabase.from("user_bikes").select("*").eq("user_id", user.id),
      ]);

      setGearInventory({
        clothing: clothing || [],
        repair_kits: repair_kits || [],
        hydration_packs: hydration_packs || [],
        bags: bags || [],
        shoes: shoes || [],
        tires: tires || [],
        bikes: bikes || [],
      });
    } catch (err) {
      console.error("Error loading gear inventory:", err);
    } finally {
      setLoadingGear(false);
    }
  }

  // Handle quick add item
  const handleQuickAdd = (item: QuickAddItem, qty: number = 1) => {
    onAdd({
      location_mile: locationMile,
      location_name: locationName,
      source_type: "custom",
      custom_name: item.name,
      custom_category: item.category,
      quantity: qty,
      is_critical: false,
    });
    // Save to user's custom items (fire and forget)
    saveCustomItem(item.name, item.category, qty);
  };

  // Handle adding a user's saved custom item
  const handleUserItemAdd = (item: UserCustomItem) => {
    onAdd({
      location_mile: locationMile,
      location_name: locationName,
      source_type: "custom",
      custom_name: item.name,
      custom_category: item.category,
      quantity: item.default_quantity,
      is_critical: false,
    });
    // Increment use count (fire and forget)
    saveCustomItem(item.name, item.category, item.default_quantity);
  };

  // Handle gear add
  const handleGearAdd = (
    gearType: GearItemType,
    gearId: string,
    gearName: string
  ) => {
    onAdd({
      location_mile: locationMile,
      location_name: locationName,
      source_type: "gear_inventory",
      gear_type: gearType,
      gear_id: gearId,
      quantity: 1,
      is_critical: false,
      gear_item: {
        id: gearId,
        name: gearName,
        type: gearType,
      },
    });
  };

  // Handle custom add
  const handleCustomAdd = () => {
    if (!customName.trim()) return;

    onAdd({
      location_mile: locationMile,
      location_name: locationName,
      source_type: "custom",
      custom_name: customName.trim(),
      custom_category: customCategory,
      quantity,
      is_critical: isCritical,
    });
    // Save to user's custom items for future reuse (fire and forget)
    saveCustomItem(customName.trim(), customCategory, quantity);
  };

  // Filter quick add items by search
  const filteredQuickItems = searchQuery
    ? QUICK_ADD_ITEMS.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : QUICK_ADD_ITEMS;

  // Group quick items by category
  const groupedQuickItems = filteredQuickItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<CustomItemCategory, QuickAddItem[]>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-navy-100">
          <div>
            <h3 className="text-lg font-semibold text-brand-navy-900">Add Item</h3>
            <p className="text-sm text-brand-navy-500">
              To {locationName} (Mile {locationMile})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-navy-400 hover:text-brand-navy-600 hover:bg-brand-navy-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-navy-100">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "quick"
                ? "text-brand-sky-600 border-b-2 border-brand-sky-500"
                : "text-brand-navy-500 hover:text-brand-navy-700"
            )}
          >
            Quick Add
          </button>
          <button
            onClick={() => setActiveTab("gear")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "gear"
                ? "text-brand-sky-600 border-b-2 border-brand-sky-500"
                : "text-brand-navy-500 hover:text-brand-navy-700"
            )}
          >
            From Gear
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "custom"
                ? "text-brand-sky-600 border-b-2 border-brand-sky-500"
                : "text-brand-navy-500 hover:text-brand-navy-700"
            )}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Quick Add Tab */}
          {activeTab === "quick" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User's Saved Items */}
              {!loadingCustomItems && userCustomItems.length > 0 && (
                <div className="pb-3 border-b border-brand-navy-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-brand-sky-500" />
                    <span className="text-sm font-medium text-brand-sky-600">
                      Your Items
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userCustomItems
                      .filter((item) =>
                        !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleUserItemAdd(item)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm ring-2 ring-brand-sky-200",
                            CATEGORY_COLORS[item.category]
                          )}
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          {item.name}
                          {item.default_quantity > 1 && (
                            <span className="ml-1 opacity-70">×{item.default_quantity}</span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Grouped Items */}
              {Object.entries(groupedQuickItems).map(([category, items]) => {
                const CategoryIcon = CATEGORY_ICONS[category as CustomItemCategory];
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className="h-4 w-4 text-brand-navy-400" />
                      <span className="text-sm font-medium text-brand-navy-600 capitalize">
                        {category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleQuickAdd(item)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm",
                            CATEGORY_COLORS[item.category]
                          )}
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gear Tab */}
          {activeTab === "gear" && (
            <div className="space-y-4">
              {loadingGear ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-sky-500" />
                </div>
              ) : !gearInventory ? (
                <p className="text-center text-brand-navy-500 py-8">
                  Failed to load gear inventory
                </p>
              ) : (
                <>
                  {/* Clothing */}
                  {gearInventory.clothing.length > 0 && (
                    <GearSection
                      title="Clothing"
                      items={gearInventory.clothing.map((c) => ({
                        id: c.id,
                        name: c.name || `${c.brand} Clothing`,
                        type: "clothing" as GearItemType,
                      }))}
                      onAdd={handleGearAdd}
                    />
                  )}

                  {/* Repair Kits */}
                  {gearInventory.repair_kits.length > 0 && (
                    <GearSection
                      title="Repair Kits"
                      items={gearInventory.repair_kits.map((r) => ({
                        id: r.id,
                        name: r.name,
                        type: "repair_kit" as GearItemType,
                      }))}
                      onAdd={handleGearAdd}
                    />
                  )}

                  {/* Bags */}
                  {gearInventory.bags.length > 0 && (
                    <GearSection
                      title="Bags"
                      items={gearInventory.bags.map((b) => ({
                        id: b.id,
                        name: `${b.brand} ${b.model}`,
                        type: "bag" as GearItemType,
                      }))}
                      onAdd={handleGearAdd}
                    />
                  )}

                  {/* Shoes */}
                  {gearInventory.shoes.length > 0 && (
                    <GearSection
                      title="Shoes"
                      items={gearInventory.shoes.map((s) => ({
                        id: s.id,
                        name: `${s.brand} ${s.model}`,
                        type: "shoe" as GearItemType,
                      }))}
                      onAdd={handleGearAdd}
                    />
                  )}

                  {/* Empty state */}
                  {gearInventory.clothing.length === 0 &&
                    gearInventory.repair_kits.length === 0 &&
                    gearInventory.bags.length === 0 &&
                    gearInventory.shoes.length === 0 && (
                      <p className="text-center text-brand-navy-500 py-8">
                        No gear in your inventory. Add gear from the Gear Inventory page.
                      </p>
                    )}
                </>
              )}
            </div>
          )}

          {/* Custom Tab */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-brand-navy-700 mb-1">
                  Item Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Energy gels"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-brand-navy-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_ICONS) as CustomItemCategory[]).map(
                    (category) => {
                      const Icon = CATEGORY_ICONS[category];
                      return (
                        <button
                          key={category}
                          onClick={() => setCustomCategory(category)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all",
                            customCategory === category
                              ? CATEGORY_COLORS[category]
                              : "border-brand-navy-200 text-brand-navy-600 hover:border-brand-navy-300"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{category}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-brand-navy-700 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Critical Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    isCritical ? "bg-red-500" : "bg-brand-navy-200"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      isCritical && "translate-x-4"
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Star
                    className={cn(
                      "h-4 w-4",
                      isCritical ? "text-red-500 fill-current" : "text-brand-navy-400"
                    )}
                  />
                  <span className="text-sm font-medium text-brand-navy-700">
                    Mark as critical item
                  </span>
                </div>
              </label>

              {/* Add Button */}
              <Button
                onClick={handleCustomAdd}
                disabled={!customName.trim()}
                className="w-full bg-brand-sky-500 hover:bg-brand-sky-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for gear sections
function GearSection({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: { id: string; name: string; type: GearItemType }[];
  onAdd: (type: GearItemType, id: string, name: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-brand-navy-600 mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onAdd(item.type, item.id, item.name)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-brand-navy-100 hover:border-brand-sky-300 hover:bg-brand-sky-50 transition-all text-left"
          >
            <div className="p-2 rounded-lg bg-brand-navy-100">
              <Package className="h-4 w-4 text-brand-navy-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-brand-navy-900">
              {item.name}
            </span>
            <Plus className="h-4 w-4 text-brand-sky-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
