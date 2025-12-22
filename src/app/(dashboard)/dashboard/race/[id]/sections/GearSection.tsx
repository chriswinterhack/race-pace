"use client";

import { useState, useEffect } from "react";
import { Bike, Circle, Wrench, Package, Loader2, Save, Plus, X, Users, TrendingUp } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VisibilityToggle } from "@/components/gear/shared";
import { BikeCard, BikeForm } from "@/components/gear/inventory";
import { TireCard, TireForm } from "@/components/gear/inventory";
import { BagCard, BagForm } from "@/components/gear/inventory";
import { RepairKitCard, RepairKitForm } from "@/components/gear/inventory";
import type {
  UserBike, UserTire, UserBag, UserRepairKit,
  RaceGearSelection, UserGearInventory,
} from "@/types/gear";

interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

interface RaceGearStats {
  total_participants: number;
  bikes: GearAggregation[];
  front_tires: GearAggregation[];
  rear_tires: GearAggregation[];
  shoes: GearAggregation[];
  hydration_packs: GearAggregation[];
}

interface RacePlan {
  id: string;
  race_distance: {
    id: string;
    race_edition: {
      race: {
        id: string;
      };
    };
  };
}

interface GearSectionProps {
  plan: RacePlan;
}

type GearPickerType = "bike" | "front_tire" | "rear_tire" | "bags" | "repair_kit" | null;

export function GearSection({ plan }: GearSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<UserGearInventory | null>(null);
  const [_selection, setSelection] = useState<RaceGearSelection | null>(null);

  // Selection state
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [selectedFrontTireId, setSelectedFrontTireId] = useState<string | null>(null);
  const [selectedRearTireId, setSelectedRearTireId] = useState<string | null>(null);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [selectedRepairKitId, setSelectedRepairKitId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Picker dialog state
  const [pickerType, setPickerType] = useState<GearPickerType>(null);

  // Add new gear dialogs
  const [addingBike, setAddingBike] = useState(false);
  const [addingTire, setAddingTire] = useState(false);
  const [addingBag, setAddingBag] = useState(false);
  const [addingRepairKit, setAddingRepairKit] = useState(false);

  // Community gear modal
  const [showCommunityGear, setShowCommunityGear] = useState(false);
  const [communityGearStats, setCommunityGearStats] = useState<RaceGearStats | null>(null);
  const [loadingCommunityGear, setLoadingCommunityGear] = useState(false);

  const supabase = createClient();

  const raceDistanceId = plan.race_distance.id;
  const raceId = plan.race_distance.race_edition.race.id;

  useEffect(() => {
    fetchData();
  }, [raceDistanceId]);

  async function fetchData() {
    setLoading(true);

    const [bikesRes, tiresRes, bagsRes, repairKitsRes] = await Promise.all([
      supabase.from("user_bikes").select("*").order("created_at", { ascending: false }),
      supabase.from("user_tires").select("*").order("created_at", { ascending: false }),
      supabase.from("user_bags").select("*").order("created_at", { ascending: false }),
      supabase.from("user_repair_kits").select("*").order("created_at", { ascending: false }),
    ]);

    setInventory({
      bikes: bikesRes.data || [],
      tires: tiresRes.data || [],
      shoes: [],
      hydration_packs: [],
      bags: bagsRes.data || [],
      repair_kits: repairKitsRes.data || [],
      clothing: [],
    });

    const { data: existingSelection } = await supabase
      .from("race_gear_selections")
      .select("*")
      .eq("race_distance_id", raceDistanceId)
      .single();

    if (existingSelection) {
      setSelection(existingSelection);
      setSelectedBikeId(existingSelection.bike_id);
      setSelectedFrontTireId(existingSelection.front_tire_id);
      setSelectedRearTireId(existingSelection.rear_tire_id);
      setSelectedRepairKitId(existingSelection.repair_kit_id);
      setIsPublic(existingSelection.is_public);

      const { data: bagData } = await supabase
        .from("race_gear_bags")
        .select("bag_id")
        .eq("race_gear_selection_id", existingSelection.id);

      if (bagData) {
        setSelectedBagIds(bagData.map((b) => b.bag_id));
      }
    }

    setLoading(false);
  }

  async function fetchCommunityGear() {
    if (communityGearStats) return; // Already loaded
    setLoadingCommunityGear(true);
    try {
      const response = await fetch(`/api/gear/community/${raceId}`);
      const result = await response.json();
      if (result.data) {
        setCommunityGearStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch community gear:", error);
    }
    setLoadingCommunityGear(false);
  }

  function handleOpenCommunityGear() {
    setShowCommunityGear(true);
    fetchCommunityGear();
  }

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch(`/api/gear/selections/${raceDistanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          race_id: raceId,
          race_distance_id: raceDistanceId,
          bike_id: selectedBikeId,
          front_tire_id: selectedFrontTireId,
          rear_tire_id: selectedRearTireId,
          repair_kit_id: selectedRepairKitId,
          bag_ids: selectedBagIds,
          is_public: isPublic,
        }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gear selection saved");
        setSelection(result.data);
      }
    } catch {
      toast.error("Failed to save gear selection");
    }

    setSaving(false);
  }

  // Get selected items from inventory
  const selectedBike = inventory?.bikes.find(b => b.id === selectedBikeId);
  const selectedFrontTire = inventory?.tires.find(t => t.id === selectedFrontTireId);
  const selectedRearTire = inventory?.tires.find(t => t.id === selectedRearTireId);
  const selectedBags = inventory?.bags.filter(b => selectedBagIds.includes(b.id)) || [];
  const selectedRepairKit = inventory?.repair_kits.find(k => k.id === selectedRepairKitId);

  const handleGearAdded = () => {
    setAddingBike(false);
    setAddingTire(false);
    setAddingBag(false);
    setAddingRepairKit(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Gear Setup</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Select equipment for race day
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleOpenCommunityGear}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Community Gear</span>
          </Button>
          <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Bike */}
      <GearSlot
        icon={Bike}
        label="Bike"
        isEmpty={!selectedBike}
        onAdd={() => setPickerType("bike")}
        onRemove={() => setSelectedBikeId(null)}
      >
        {selectedBike && (
          <CompactGearCard
            title={`${selectedBike.brand} ${selectedBike.model}`}
            subtitle={selectedBike.year?.toString()}
            imageUrl={selectedBike.image_url}
            icon={Bike}
          />
        )}
      </GearSlot>

      {/* Tires */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GearSlot
          icon={Circle}
          label="Front Tire"
          isEmpty={!selectedFrontTire}
          onAdd={() => setPickerType("front_tire")}
          onRemove={() => setSelectedFrontTireId(null)}
        >
          {selectedFrontTire && (
            <CompactGearCard
              title={`${selectedFrontTire.brand} ${selectedFrontTire.model}`}
              subtitle={`${selectedFrontTire.width_value}${selectedFrontTire.width_unit === "in" ? '"' : 'mm'}`}
              icon={Circle}
            />
          )}
        </GearSlot>

        <GearSlot
          icon={Circle}
          label="Rear Tire"
          isEmpty={!selectedRearTire}
          onAdd={() => setPickerType("rear_tire")}
          onRemove={() => setSelectedRearTireId(null)}
        >
          {selectedRearTire && (
            <CompactGearCard
              title={`${selectedRearTire.brand} ${selectedRearTire.model}`}
              subtitle={`${selectedRearTire.width_value}${selectedRearTire.width_unit === "in" ? '"' : 'mm'}`}
              icon={Circle}
            />
          )}
        </GearSlot>
      </div>

      {/* Bags */}
      <GearSlot
        icon={Package}
        label="Bags"
        isEmpty={selectedBags.length === 0}
        onAdd={() => setPickerType("bags")}
        onRemove={() => setSelectedBagIds([])}
        multiSelect
      >
        {selectedBags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedBags.map(bag => (
              <div
                key={bag.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-navy-100 rounded-lg"
              >
                <span className="text-sm font-medium text-brand-navy-700">
                  {bag.brand} {bag.model}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBagIds(selectedBagIds.filter(id => id !== bag.id));
                  }}
                  className="text-brand-navy-400 hover:text-brand-navy-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GearSlot>

      {/* Repair Kit */}
      <GearSlot
        icon={Wrench}
        label="Repair Kit"
        isEmpty={!selectedRepairKit}
        onAdd={() => setPickerType("repair_kit")}
        onRemove={() => setSelectedRepairKitId(null)}
      >
        {selectedRepairKit && (
          <CompactGearCard
            title={selectedRepairKit.name}
            subtitle={`${selectedRepairKit.items.length} items`}
            icon={Wrench}
          />
        )}
      </GearSlot>

      {/* Gear Picker Dialog */}
      <Dialog open={pickerType !== null} onOpenChange={(open) => !open && setPickerType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {pickerType === "bike" && "Select Bike"}
              {pickerType === "front_tire" && "Select Front Tire"}
              {pickerType === "rear_tire" && "Select Rear Tire"}
              {pickerType === "bags" && "Select Bags"}
              {pickerType === "repair_kit" && "Select Repair Kit"}
            </DialogTitle>
          </DialogHeader>

          {/* Bike Picker */}
          {pickerType === "bike" && (
            <GearPicker
              items={inventory?.bikes || []}
              selectedIds={selectedBikeId ? [selectedBikeId] : []}
              onSelect={(id) => {
                setSelectedBikeId(id);
                setPickerType(null);
              }}
              onAddNew={() => { setPickerType(null); setAddingBike(true); }}
              renderItem={(bike: UserBike) => (
                <BikeCard
                  bike={bike}
                  selectable
                  selected={selectedBikeId === bike.id}
                  onSelect={() => {
                    setSelectedBikeId(bike.id);
                    setPickerType(null);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              emptyMessage="No bikes in your inventory"
            />
          )}

          {/* Front Tire Picker */}
          {pickerType === "front_tire" && (
            <GearPicker
              items={inventory?.tires || []}
              selectedIds={selectedFrontTireId ? [selectedFrontTireId] : []}
              onSelect={(id) => {
                setSelectedFrontTireId(id);
                setPickerType(null);
              }}
              onAddNew={() => { setPickerType(null); setAddingTire(true); }}
              renderItem={(tire: UserTire) => (
                <TireCard
                  tire={tire}
                  selectable
                  selected={selectedFrontTireId === tire.id}
                  onSelect={() => {
                    setSelectedFrontTireId(tire.id);
                    setPickerType(null);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              emptyMessage="No tires in your inventory"
            />
          )}

          {/* Rear Tire Picker */}
          {pickerType === "rear_tire" && (
            <GearPicker
              items={inventory?.tires || []}
              selectedIds={selectedRearTireId ? [selectedRearTireId] : []}
              onSelect={(id) => {
                setSelectedRearTireId(id);
                setPickerType(null);
              }}
              onAddNew={() => { setPickerType(null); setAddingTire(true); }}
              renderItem={(tire: UserTire) => (
                <TireCard
                  tire={tire}
                  selectable
                  selected={selectedRearTireId === tire.id}
                  onSelect={() => {
                    setSelectedRearTireId(tire.id);
                    setPickerType(null);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              emptyMessage="No tires in your inventory"
            />
          )}

          {/* Bags Picker (multi-select) */}
          {pickerType === "bags" && (
            <GearPicker
              items={inventory?.bags || []}
              selectedIds={selectedBagIds}
              multiSelect
              onToggle={(id) => {
                if (selectedBagIds.includes(id)) {
                  setSelectedBagIds(selectedBagIds.filter(i => i !== id));
                } else {
                  setSelectedBagIds([...selectedBagIds, id]);
                }
              }}
              onAddNew={() => { setPickerType(null); setAddingBag(true); }}
              renderItem={(bag: UserBag) => (
                <BagCard
                  bag={bag}
                  selectable
                  selected={selectedBagIds.includes(bag.id)}
                  onSelect={() => {
                    if (selectedBagIds.includes(bag.id)) {
                      setSelectedBagIds(selectedBagIds.filter(i => i !== bag.id));
                    } else {
                      setSelectedBagIds([...selectedBagIds, bag.id]);
                    }
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              emptyMessage="No bags in your inventory"
            />
          )}

          {/* Repair Kit Picker */}
          {pickerType === "repair_kit" && (
            <GearPicker
              items={inventory?.repair_kits || []}
              selectedIds={selectedRepairKitId ? [selectedRepairKitId] : []}
              onSelect={(id) => {
                setSelectedRepairKitId(id);
                setPickerType(null);
              }}
              onAddNew={() => { setPickerType(null); setAddingRepairKit(true); }}
              renderItem={(kit: UserRepairKit) => (
                <RepairKitCard
                  kit={kit}
                  selectable
                  selected={selectedRepairKitId === kit.id}
                  onSelect={() => {
                    setSelectedRepairKitId(kit.id);
                    setPickerType(null);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              emptyMessage="No repair kits in your inventory"
            />
          )}

          {pickerType === "bags" && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setPickerType(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Gear Dialogs */}
      <Dialog open={addingBike} onOpenChange={(open) => !open && setAddingBike(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bike to Inventory</DialogTitle>
          </DialogHeader>
          <BikeForm onSave={handleGearAdded} onCancel={() => setAddingBike(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingTire} onOpenChange={(open) => !open && setAddingTire(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tire to Inventory</DialogTitle>
          </DialogHeader>
          <TireForm onSave={handleGearAdded} onCancel={() => setAddingTire(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingBag} onOpenChange={(open) => !open && setAddingBag(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bag to Inventory</DialogTitle>
          </DialogHeader>
          <BagForm onSave={handleGearAdded} onCancel={() => setAddingBag(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingRepairKit} onOpenChange={(open) => !open && setAddingRepairKit(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repair Kit to Inventory</DialogTitle>
          </DialogHeader>
          <RepairKitForm onSave={handleGearAdded} onCancel={() => setAddingRepairKit(false)} />
        </DialogContent>
      </Dialog>

      {/* Community Gear Modal */}
      <Dialog open={showCommunityGear} onOpenChange={setShowCommunityGear}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-sky-500" />
              Community Gear Choices
            </DialogTitle>
          </DialogHeader>
          <CommunityGearDisplay
            stats={communityGearStats}
            loading={loadingCommunityGear}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Gear slot component - shows selected gear or empty state
interface GearSlotProps {
  icon: typeof Bike;
  label: string;
  isEmpty: boolean;
  onAdd: () => void;
  onRemove: () => void;
  multiSelect?: boolean;
  children?: React.ReactNode;
}

function GearSlot({ icon: Icon, label, isEmpty, onAdd, onRemove, multiSelect, children }: GearSlotProps) {
  return (
    <div className="border border-brand-navy-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-brand-navy-600" />
          <h4 className="font-medium text-brand-navy-900">{label}</h4>
        </div>
        {isEmpty ? (
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
              {multiSelect ? <Plus className="h-4 w-4" /> : "Change"}
            </Button>
            {!multiSelect && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-brand-navy-500 hover:text-red-500">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-4 bg-brand-navy-50 rounded-lg">
          <p className="text-sm text-brand-navy-500">No {label.toLowerCase()} selected</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// Compact gear card for display in slots
interface CompactGearCardProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  icon?: typeof Bike;
}

function CompactGearCard({ title, subtitle, imageUrl, icon: Icon }: CompactGearCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-navy-50 rounded-lg">
      {imageUrl ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-navy-700 to-brand-navy-800 flex-shrink-0 flex items-center justify-center">
          {Icon && <Icon className="h-8 w-8 text-white" />}
        </div>
      )}
      <div>
        <p className="font-medium text-brand-navy-900">{title}</p>
        {subtitle && <p className="text-sm text-brand-navy-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// Gear picker component for selecting from inventory
interface GearPickerProps<T extends { id: string }> {
  items: T[];
  selectedIds: string[];
  onSelect?: (id: string) => void;
  onToggle?: (id: string) => void;
  onAddNew: () => void;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage: string;
  multiSelect?: boolean;
}

function GearPicker<T extends { id: string }>({
  items,
  onAddNew,
  renderItem,
  emptyMessage,
}: GearPickerProps<T>) {
  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
          <p className="text-brand-navy-500 mb-4">{emptyMessage}</p>
          <Button onClick={onAddNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="pt-4 border-t border-brand-navy-100">
          <Button variant="outline" onClick={onAddNew} className="w-full gap-1.5">
            <Plus className="h-4 w-4" />
            Add New to Inventory
          </Button>
        </div>
      )}
    </div>
  );
}

// Community Gear Display Component
function CommunityGearDisplay({
  stats,
  loading,
}: {
  stats: RaceGearStats | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!stats || stats.total_participants === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
        <h3 className="text-lg font-semibold text-brand-navy-900">
          No gear data yet
        </h3>
        <p className="mt-2 text-brand-navy-600">
          Be the first to share your setup for this race!
        </p>
      </div>
    );
  }

  const combinedTires = combineTiresForDisplay(stats.front_tires, stats.rear_tires);

  return (
    <div className="space-y-6 py-2">
      <p className="text-sm text-brand-navy-600">
        See what {stats.total_participants} {stats.total_participants === 1 ? "rider is" : "riders are"} running for this race
      </p>

      {/* Bikes */}
      {stats.bikes.length > 0 && (
        <GearStatsSection
          title="Popular Bikes"
          icon={<Bike className="h-5 w-5" />}
          items={stats.bikes}
          color="sky"
        />
      )}

      {/* Tires */}
      {combinedTires.length > 0 && (
        <GearStatsSection
          title="Popular Tires"
          icon={<Circle className="h-5 w-5" />}
          items={combinedTires}
          color="amber"
        />
      )}
    </div>
  );
}

// Gear Stats Section Component
function GearStatsSection({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: GearAggregation[];
  color: "sky" | "amber";
}) {
  const topItems = items.slice(0, 5);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "p-2 rounded-lg",
          color === "sky" ? "bg-brand-sky-100 text-brand-sky-600" : "bg-amber-100 text-amber-600"
        )}>
          {icon}
        </span>
        <h3 className="font-semibold text-brand-navy-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {topItems.map((item, index) => (
          <div key={`${item.brand}-${item.model}-${item.width || ''}-${index}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-brand-navy-900">
                {item.brand} {item.model}
                {item.width && (
                  <span className="ml-1.5 text-sm font-normal text-brand-navy-500">
                    ({item.width})
                  </span>
                )}
              </span>
              <span className="text-sm text-brand-navy-500">
                {item.count} {item.count === 1 ? "rider" : "riders"} · {item.percentage}%
              </span>
            </div>
            <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  color === "sky" ? "bg-brand-sky-500" : "bg-amber-500"
                )}
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  opacity: 1 - index * 0.1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to combine front and rear tire data
function combineTiresForDisplay(
  frontTires: GearAggregation[],
  rearTires: GearAggregation[]
): GearAggregation[] {
  const combined = new Map<string, GearAggregation>();

  [...frontTires, ...rearTires].forEach((tire) => {
    const key = `${tire.brand}|${tire.model}|${tire.width || ''}`;
    const existing = combined.get(key);
    if (existing) {
      existing.count = Math.max(existing.count, tire.count);
      existing.percentage = Math.max(existing.percentage, tire.percentage);
    } else {
      combined.set(key, { ...tire });
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
