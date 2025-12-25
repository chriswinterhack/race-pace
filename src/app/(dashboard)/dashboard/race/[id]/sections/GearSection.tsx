"use client";

import { useState, useEffect } from "react";
import {
  Bike, Circle, Wrench, Package, Loader2, Save, Plus, X, Users,
  TrendingUp, Eye, EyeOff, Sparkles, Award
} from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BikeCard, BikeForm } from "@/components/gear/inventory";
import { TireCard, TireForm } from "@/components/gear/inventory";
import { BagCard, BagForm } from "@/components/gear/inventory";
import { RepairKitCard, RepairKitForm } from "@/components/gear/inventory";
import type { UserBike, UserTire, UserGearInventory } from "@/types/gear";

interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

interface CommunityStats {
  totalParticipants: number;
  sharingGear: number;
  bikes: GearAggregation[];
  tires: GearAggregation[];
  repairKitItems: { item: string; count: number }[];
}

interface RacePlan {
  id: string;
  race_distance: {
    id: string;
    name: string | null;
    race_edition: {
      race: {
        id: string;
        name: string;
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
  const [hasChanges, setHasChanges] = useState(false);

  // Selection state
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [selectedFrontTireId, setSelectedFrontTireId] = useState<string | null>(null);
  const [selectedRearTireId, setSelectedRearTireId] = useState<string | null>(null);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [selectedRepairKitId, setSelectedRepairKitId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Community stats
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);

  // Picker dialog state
  const [pickerType, setPickerType] = useState<GearPickerType>(null);

  // Add new gear dialogs
  const [addingBike, setAddingBike] = useState(false);
  const [addingTire, setAddingTire] = useState(false);
  const [addingBag, setAddingBag] = useState(false);
  const [addingRepairKit, setAddingRepairKit] = useState(false);

  const supabase = createClient();
  const raceDistanceId = plan.race_distance.id;
  const raceId = plan.race_distance.race_edition.race.id;
  const raceName = plan.race_distance.race_edition.race.name;

  useEffect(() => {
    fetchAllData();
  }, [raceDistanceId]);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([fetchInventoryAndSelection(), fetchCommunityStats()]);
    setLoading(false);
  }

  async function fetchInventoryAndSelection() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch inventory
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

    // Fetch existing selection - FILTER BY USER ID
    const { data: existingSelection } = await supabase
      .from("race_gear_selections")
      .select("*")
      .eq("race_distance_id", raceDistanceId)
      .eq("user_id", user.id)
      .single();

    if (existingSelection) {
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
  }

  async function fetchCommunityStats() {
    try {
      // Fetch all public gear selections for this race
      const { data: gearSelections } = await supabase
        .from("race_gear_selections")
        .select(`
          id,
          user_id,
          is_public,
          bike:user_bikes!race_gear_selections_bike_id_fkey (brand, model),
          front_tire:user_tires!race_gear_selections_front_tire_id_fkey (brand, model, width_value, width_unit),
          rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (brand, model, width_value, width_unit),
          repair_kit:user_repair_kits!race_gear_selections_repair_kit_id_fkey (items)
        `)
        .eq("race_id", raceId)
        .eq("is_public", true);

      // Count total participants
      const { count: totalPlans } = await supabase
        .from("race_plans")
        .select("*", { count: "exact", head: true })
        .eq("race_distance_id", raceDistanceId);

      const publicGear = gearSelections || [];

      // Aggregate bikes
      const bikeMap = new Map<string, number>();
      publicGear.forEach(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bike = s.bike as any;
        if (bike?.brand && bike?.model) {
          const key = `${bike.brand}|${bike.model}`;
          bikeMap.set(key, (bikeMap.get(key) || 0) + 1);
        }
      });

      const bikes: GearAggregation[] = Array.from(bikeMap.entries())
        .map(([key, count]) => {
          const [brand, model] = key.split("|");
          return { brand: brand!, model: model!, count, percentage: Math.round((count / Math.max(publicGear.length, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate tires
      const tireMap = new Map<string, number>();
      publicGear.forEach(s => {
        [s.front_tire, s.rear_tire].forEach(tire => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = tire as any;
          if (t?.brand && t?.model) {
            const width = t.width_value ? `${t.width_value}${t.width_unit === "in" ? '"' : 'mm'}` : "";
            const key = `${t.brand}|${t.model}|${width}`;
            tireMap.set(key, (tireMap.get(key) || 0) + 1);
          }
        });
      });

      const tires: GearAggregation[] = Array.from(tireMap.entries())
        .map(([key, count]) => {
          const [brand, model, width] = key.split("|");
          return { brand: brand!, model: model!, width: width || undefined, count, percentage: Math.round((count / Math.max(publicGear.length, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate repair kit items
      const repairItemMap = new Map<string, number>();
      publicGear.forEach(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kit = s.repair_kit as any;
        const items = kit?.items as string[] | undefined;
        items?.forEach(item => {
          repairItemMap.set(item, (repairItemMap.get(item) || 0) + 1);
        });
      });

      const repairKitItems = Array.from(repairItemMap.entries())
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count);

      setCommunityStats({
        totalParticipants: totalPlans || 0,
        sharingGear: publicGear.length,
        bikes,
        tires,
        repairKitItems,
      });
    } catch (error) {
      console.error("Failed to fetch community stats:", error);
    }
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
        toast.success("Gear selection saved!");
        setHasChanges(false);
        // Refresh community stats to include our new data
        fetchCommunityStats();
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

  // Community insights for selected items
  const bikePopularity = selectedBike ? communityStats?.bikes.find(
    b => b.brand === selectedBike.brand && b.model === selectedBike.model
  ) : null;

  const frontTirePopularity = selectedFrontTire ? communityStats?.tires.find(
    t => t.brand === selectedFrontTire.brand && t.model === selectedFrontTire.model
  ) : null;

  const handleGearAdded = () => {
    setAddingBike(false);
    setAddingTire(false);
    setAddingBag(false);
    setAddingRepairKit(false);
    fetchInventoryAndSelection();
  };

  const handleSelectionChange = () => {
    setHasChanges(true);
  };

  // Gear completion percentage
  const gearSlots = [selectedBike, selectedFrontTire, selectedRearTire, selectedRepairKit];
  const filledSlots = gearSlots.filter(Boolean).length;
  const completionPercent = Math.round((filledSlots / gearSlots.length) * 100);

  if (loading) {
    return <GearSectionSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900 p-6 sm:p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-brand-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-brand-sky-400/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Gear Setup</h2>
            <p className="mt-1 text-brand-sky-100/80">
              Configure your race day equipment for {raceName}
            </p>

            {/* Community stats */}
            {communityStats && communityStats.sharingGear > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-brand-sky-300" />
                  <span className="text-sm font-medium">
                    {communityStats.sharingGear} rider{communityStats.sharingGear !== 1 ? "s" : ""} sharing gear
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">See what they're running</span>
                </div>
              </div>
            )}
          </div>

          {/* Completion & Visibility */}
          <div className="flex items-center gap-4">
            {/* Completion ring */}
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke={completionPercent === 100 ? "#22c55e" : "#38bdf8"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercent * 1.76} 176`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{completionPercent}%</span>
              </div>
            </div>

            {/* Visibility toggle */}
            <button
              onClick={() => { setIsPublic(!isPublic); handleSelectionChange(); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                isPublic
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-white/10 text-white/70 border border-white/20"
              )}
            >
              {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="text-sm font-medium">{isPublic ? "Public" : "Private"}</span>
            </button>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={cn(
                "gap-2 shadow-lg",
                hasChanges
                  ? "bg-brand-sky-500 hover:bg-brand-sky-600"
                  : "bg-white/20 hover:bg-white/30"
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {hasChanges ? "Save" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Setup - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bike */}
          <GearSlotCard
            icon={Bike}
            label="Bike"
            description="Your race machine"
            isEmpty={!selectedBike}
            popularity={bikePopularity}
            onAdd={() => setPickerType("bike")}
            onRemove={() => { setSelectedBikeId(null); handleSelectionChange(); }}
          >
            {selectedBike && (
              <SelectedGearDisplay
                title={`${selectedBike.brand} ${selectedBike.model}`}
                subtitle={selectedBike.year?.toString()}
                imageUrl={selectedBike.image_url}
                icon={Bike}
                popularity={bikePopularity}
              />
            )}
          </GearSlotCard>

          {/* Tires Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <GearSlotCard
              icon={Circle}
              label="Front Tire"
              description="Leading grip"
              isEmpty={!selectedFrontTire}
              popularity={frontTirePopularity}
              onAdd={() => setPickerType("front_tire")}
              onRemove={() => { setSelectedFrontTireId(null); handleSelectionChange(); }}
              compact
            >
              {selectedFrontTire && (
                <SelectedGearDisplay
                  title={`${selectedFrontTire.brand} ${selectedFrontTire.model}`}
                  subtitle={`${selectedFrontTire.width_value}${selectedFrontTire.width_unit === "in" ? '"' : 'mm'}`}
                  icon={Circle}
                  compact
                />
              )}
            </GearSlotCard>

            <GearSlotCard
              icon={Circle}
              label="Rear Tire"
              description="Power transfer"
              isEmpty={!selectedRearTire}
              onAdd={() => setPickerType("rear_tire")}
              onRemove={() => { setSelectedRearTireId(null); handleSelectionChange(); }}
              compact
            >
              {selectedRearTire && (
                <SelectedGearDisplay
                  title={`${selectedRearTire.brand} ${selectedRearTire.model}`}
                  subtitle={`${selectedRearTire.width_value}${selectedRearTire.width_unit === "in" ? '"' : 'mm'}`}
                  icon={Circle}
                  compact
                />
              )}
            </GearSlotCard>
          </div>

          {/* On Bike Storage */}
          <GearSlotCard
            icon={Package}
            label="On Bike Storage"
            description="Bags and packs"
            isEmpty={selectedBags.length === 0}
            onAdd={() => setPickerType("bags")}
            onRemove={() => { setSelectedBagIds([]); handleSelectionChange(); }}
            multiSelect
          >
            {selectedBags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBags.map(bag => (
                  <div
                    key={bag.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-brand-navy-100 to-brand-navy-50 rounded-xl border border-brand-navy-200"
                  >
                    <Package className="h-4 w-4 text-brand-navy-500" />
                    <span className="text-sm font-medium text-brand-navy-700">
                      {bag.brand} {bag.model}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBagIds(selectedBagIds.filter(id => id !== bag.id));
                        handleSelectionChange();
                      }}
                      className="ml-1 text-brand-navy-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GearSlotCard>

          {/* Repair Kit */}
          <GearSlotCard
            icon={Wrench}
            label="Repair Kit"
            description="Emergency essentials"
            isEmpty={!selectedRepairKit}
            onAdd={() => setPickerType("repair_kit")}
            onRemove={() => { setSelectedRepairKitId(null); handleSelectionChange(); }}
          >
            {selectedRepairKit && (
              <div className="space-y-3">
                <SelectedGearDisplay
                  title={selectedRepairKit.name}
                  subtitle={`${selectedRepairKit.items.length} items`}
                  icon={Wrench}
                />
                <div className="flex flex-wrap gap-1.5">
                  {selectedRepairKit.items.slice(0, 6).map((item, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-md">
                      {item}
                    </span>
                  ))}
                  {selectedRepairKit.items.length > 6 && (
                    <span className="px-2 py-1 text-xs font-medium bg-brand-navy-100 text-brand-navy-600 rounded-md">
                      +{selectedRepairKit.items.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </GearSlotCard>
        </div>

        {/* Community Insights Sidebar */}
        <div className="space-y-6">
          <CommunityInsightsPanel stats={communityStats} />
        </div>
      </div>

      {/* Gear Picker Dialog */}
      <Dialog open={pickerType !== null} onOpenChange={(open) => !open && setPickerType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {pickerType === "bike" && <><Bike className="h-5 w-5 text-brand-sky-500" /> Select Bike</>}
              {pickerType === "front_tire" && <><Circle className="h-5 w-5 text-amber-500" /> Select Front Tire</>}
              {pickerType === "rear_tire" && <><Circle className="h-5 w-5 text-amber-500" /> Select Rear Tire</>}
              {pickerType === "bags" && <><Package className="h-5 w-5 text-brand-navy-500" /> Select Storage Bags</>}
              {pickerType === "repair_kit" && <><Wrench className="h-5 w-5 text-purple-500" /> Select Repair Kit</>}
            </DialogTitle>
          </DialogHeader>

          {/* Bike Picker */}
          {pickerType === "bike" && (
            <GearPickerWithInsights
              items={inventory?.bikes || []}
              communityItems={communityStats?.bikes || []}
              selectedId={selectedBikeId}
              onSelect={(id) => {
                setSelectedBikeId(id);
                setPickerType(null);
                handleSelectionChange();
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
                    handleSelectionChange();
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              getItemKey={(bike) => `${bike.brand}|${bike.model}`}
              emptyMessage="No bikes in your inventory"
            />
          )}

          {/* Front Tire Picker */}
          {pickerType === "front_tire" && (
            <GearPickerWithInsights
              items={inventory?.tires || []}
              communityItems={communityStats?.tires || []}
              selectedId={selectedFrontTireId}
              onSelect={(id) => {
                setSelectedFrontTireId(id);
                setPickerType(null);
                handleSelectionChange();
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
                    handleSelectionChange();
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              getItemKey={(tire) => `${tire.brand}|${tire.model}`}
              emptyMessage="No tires in your inventory"
            />
          )}

          {/* Rear Tire Picker */}
          {pickerType === "rear_tire" && (
            <GearPickerWithInsights
              items={inventory?.tires || []}
              communityItems={communityStats?.tires || []}
              selectedId={selectedRearTireId}
              onSelect={(id) => {
                setSelectedRearTireId(id);
                setPickerType(null);
                handleSelectionChange();
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
                    handleSelectionChange();
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              getItemKey={(tire) => `${tire.brand}|${tire.model}`}
              emptyMessage="No tires in your inventory"
            />
          )}

          {/* Bags Picker */}
          {pickerType === "bags" && (
            <div className="space-y-4">
              {(inventory?.bags || []).length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(inventory?.bags || []).map((bag) => (
                    <BagCard
                      key={bag.id}
                      bag={bag}
                      selectable
                      selected={selectedBagIds.includes(bag.id)}
                      onSelect={() => {
                        if (selectedBagIds.includes(bag.id)) {
                          setSelectedBagIds(selectedBagIds.filter(id => id !== bag.id));
                        } else {
                          setSelectedBagIds([...selectedBagIds, bag.id]);
                        }
                        handleSelectionChange();
                      }}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <EmptyInventoryState onAdd={() => { setPickerType(null); setAddingBag(true); }} />
              )}
              {(inventory?.bags || []).length > 0 && (
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => { setPickerType(null); setAddingBag(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Bag
                  </Button>
                  <Button onClick={() => setPickerType(null)}>Done</Button>
                </div>
              )}
            </div>
          )}

          {/* Repair Kit Picker */}
          {pickerType === "repair_kit" && (
            <div className="space-y-4">
              {(inventory?.repair_kits || []).length > 0 ? (
                <>
                  {/* Popular repair items banner */}
                  {communityStats && communityStats.repairKitItems.length > 0 && (
                    <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">Most common repair items:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {communityStats.repairKitItems.slice(0, 6).map(({ item, count }) => (
                          <span key={item} className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md">
                            {item} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(inventory?.repair_kits || []).map((kit) => (
                      <RepairKitCard
                        key={kit.id}
                        kit={kit}
                        selectable
                        selected={selectedRepairKitId === kit.id}
                        onSelect={() => {
                          setSelectedRepairKitId(kit.id);
                          setPickerType(null);
                          handleSelectionChange();
                        }}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                  <div className="pt-4 border-t border-brand-navy-100">
                    <Button variant="outline" onClick={() => { setPickerType(null); setAddingRepairKit(true); }} className="w-full gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add New Repair Kit
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyInventoryState onAdd={() => { setPickerType(null); setAddingRepairKit(true); }} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Gear Dialogs */}
      <Dialog open={addingBike} onOpenChange={setAddingBike}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Bike to Inventory</DialogTitle></DialogHeader>
          <BikeForm onSave={handleGearAdded} onCancel={() => setAddingBike(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingTire} onOpenChange={setAddingTire}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tire to Inventory</DialogTitle></DialogHeader>
          <TireForm onSave={handleGearAdded} onCancel={() => setAddingTire(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingBag} onOpenChange={setAddingBag}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Bag to Inventory</DialogTitle></DialogHeader>
          <BagForm onSave={handleGearAdded} onCancel={() => setAddingBag(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingRepairKit} onOpenChange={setAddingRepairKit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Repair Kit to Inventory</DialogTitle></DialogHeader>
          <RepairKitForm onSave={handleGearAdded} onCancel={() => setAddingRepairKit(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Skeleton loader
function GearSectionSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

// Gear Slot Card Component
function GearSlotCard({
  icon: Icon,
  label,
  description,
  isEmpty,
  popularity,
  onAdd,
  onRemove,
  multiSelect,
  compact,
  children,
}: {
  icon: typeof Bike;
  label: string;
  description: string;
  isEmpty: boolean;
  popularity?: GearAggregation | null;
  onAdd: () => void;
  onRemove: () => void;
  multiSelect?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "relative rounded-xl border bg-white overflow-hidden transition-all",
      isEmpty ? "border-dashed border-brand-navy-300 hover:border-brand-sky-400" : "border-brand-navy-200 shadow-sm"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4",
        compact ? "py-3" : "py-4",
        !isEmpty && "border-b border-brand-navy-100"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isEmpty ? "bg-brand-navy-100" : "bg-gradient-to-br from-brand-sky-100 to-brand-sky-50"
          )}>
            <Icon className={cn("h-5 w-5", isEmpty ? "text-brand-navy-400" : "text-brand-sky-600")} />
          </div>
          <div>
            <h4 className="font-semibold text-brand-navy-900">{label}</h4>
            {!compact && <p className="text-xs text-brand-navy-500">{description}</p>}
          </div>
        </div>

        {isEmpty ? (
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {popularity && popularity.count > 1 && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                <Users className="h-3 w-3" />
                {popularity.count} others
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onAdd}>
              {multiSelect ? <Plus className="h-4 w-4" /> : "Change"}
            </Button>
            {!multiSelect && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-brand-navy-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        {isEmpty ? (
          <button
            onClick={onAdd}
            className={cn(
              "w-full flex items-center justify-center rounded-lg border-2 border-dashed border-brand-navy-200 text-brand-navy-400",
              "hover:border-brand-sky-400 hover:text-brand-sky-600 transition-all",
              compact ? "h-16" : "h-20"
            )}
          >
            <span className="text-sm font-medium">Click to add {label.toLowerCase()}</span>
          </button>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Selected Gear Display
function SelectedGearDisplay({
  title,
  subtitle,
  imageUrl,
  icon: Icon,
  popularity,
  compact,
}: {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  icon?: typeof Bike;
  popularity?: GearAggregation | null;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      {imageUrl ? (
        <div className={cn(
          "rounded-xl overflow-hidden flex-shrink-0 bg-brand-navy-100",
          compact ? "w-12 h-12" : "w-16 h-16"
        )}>
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : Icon && (
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-brand-navy-700 to-brand-navy-800 flex-shrink-0 flex items-center justify-center",
          compact ? "w-12 h-12" : "w-16 h-16"
        )}>
          <Icon className={cn("text-white", compact ? "h-6 w-6" : "h-8 w-8")} />
        </div>
      )}
      <div className="min-w-0">
        <p className={cn("font-medium text-brand-navy-900 truncate", compact && "text-sm")}>{title}</p>
        {subtitle && <p className={cn("text-brand-navy-500 truncate", compact ? "text-xs" : "text-sm")}>{subtitle}</p>}
        {popularity && popularity.count > 1 && !compact && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Award className="h-3 w-3" />
            {popularity.percentage}% of riders chose this
          </p>
        )}
      </div>
    </div>
  );
}

// Community Insights Panel
function CommunityInsightsPanel({ stats }: { stats: CommunityStats | null }) {
  if (!stats || stats.sharingGear === 0) {
    return (
      <div className="rounded-xl border border-brand-navy-200 bg-gradient-to-b from-brand-navy-50 to-white p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-navy-100 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-brand-navy-400" />
        </div>
        <h4 className="font-semibold text-brand-navy-900">Be a Trailblazer</h4>
        <p className="mt-2 text-sm text-brand-navy-600">
          You're among the first to share gear for this race. Your setup will help others decide what to bring!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Popular Bikes */}
      {stats.bikes.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-brand-sky-50 border-b border-brand-sky-100">
            <div className="flex items-center gap-2">
              <Bike className="h-4 w-4 text-brand-sky-600" />
              <h4 className="font-semibold text-brand-sky-900 text-sm">Popular Bikes</h4>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.bikes.slice(0, 3).map((bike, i) => (
              <div key={`${bike.brand}-${bike.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {bike.brand} {bike.model}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {bike.count} rider{bike.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tires */}
      {stats.tires.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-amber-900 text-sm">Popular Tires</h4>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.tires.slice(0, 3).map((tire, i) => (
              <div key={`${tire.brand}-${tire.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {tire.brand} {tire.model}
                  {tire.width && <span className="text-brand-navy-400 ml-1">({tire.width})</span>}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {tire.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repair Kit Essentials */}
      {stats.repairKitItems.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-purple-900 text-sm">Repair Essentials</h4>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {stats.repairKitItems.slice(0, 8).map(({ item, count }) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-md"
                >
                  {item}
                  <span className="text-purple-400">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Gear Picker with Community Insights
function GearPickerWithInsights<T extends { id: string; brand: string; model: string }>({
  items,
  communityItems,
  onAddNew,
  renderItem,
  getItemKey,
}: {
  items: T[];
  communityItems: GearAggregation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  emptyMessage: string;
}) {
  // Find community popularity for each item
  const getPopularity = (item: T) => {
    const key = getItemKey(item);
    return communityItems.find(c => `${c.brand}|${c.model}` === key);
  };

  if (items.length === 0) {
    return <EmptyInventoryState onAdd={onAddNew} />;
  }

  // Sort items by popularity
  const sortedItems = [...items].sort((a, b) => {
    const popA = getPopularity(a);
    const popB = getPopularity(b);
    return (popB?.count || 0) - (popA?.count || 0);
  });

  return (
    <div className="space-y-4">
      {/* Popular picks banner */}
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

// Empty Inventory State
function EmptyInventoryState({ onAdd }: { onAdd: () => void }) {
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
