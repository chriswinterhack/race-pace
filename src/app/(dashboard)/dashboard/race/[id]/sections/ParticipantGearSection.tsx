"use client";

import { useState, useEffect } from "react";
import {
  Bike, Circle, Wrench, Package, Loader2, Save, Plus, X, Users,
  TrendingUp, Eye, EyeOff, Sparkles, Award, ChevronDown, ChevronUp, Share2, Footprints, Maximize2
} from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BikeCard, BikeForm } from "@/components/gear/inventory";
import { TireCard, TireForm } from "@/components/gear/inventory";
import { RepairKitCard, RepairKitForm } from "@/components/gear/inventory";
import { ShoeCard, ShoeForm } from "@/components/gear/inventory";
import type { UserBike, UserTire, UserShoe, UserGearInventory } from "@/types/gear";

interface RacePlan {
  id: string;
  user_id: string;
  race_distance: {
    id: string;
    name: string | null;
    distance_miles: number;
    race_edition: {
      id: string;
      year: number;
      race: {
        id: string;
        name: string;
      };
    };
  };
}

interface ParticipantGearSectionProps {
  plan: RacePlan;
}

interface ParticipantGear {
  id: string;
  userId: string;
  displayName: string;
  isPublic: boolean;
  bike: { brand: string; model: string; year?: number; imageUrl?: string } | null;
  frontTire: { brand: string; model: string; width?: string } | null;
  rearTire: { brand: string; model: string; width?: string } | null;
  shoes: { brand: string; model: string } | null;
  repairKit: { name: string; items: string[] } | null;
}

type ShowAllCategory = "bikes" | "tires" | "shoes" | null;

interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

interface CommunityStats {
  totalWithGear: number;
  publicCount: number;
  bikes: GearAggregation[];
  tires: GearAggregation[];
  shoes: GearAggregation[];
  repairKitItems: { item: string; count: number }[];
}

type GearPickerType = "bike" | "front_tire" | "rear_tire" | "shoes" | "repair_kit" | null;

export function ParticipantGearSection({ plan }: ParticipantGearSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<UserGearInventory | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Selection state (current user's gear)
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [selectedFrontTireId, setSelectedFrontTireId] = useState<string | null>(null);
  const [selectedRearTireId, setSelectedRearTireId] = useState<string | null>(null);
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null);
  const [selectedRepairKitId, setSelectedRepairKitId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [hasExistingSelection, setHasExistingSelection] = useState(false);

  // Community data
  const [participants, setParticipants] = useState<ParticipantGear[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  // Current user
  const [, setCurrentUserId] = useState<string | null>(null);

  // Picker dialog state
  const [pickerType, setPickerType] = useState<GearPickerType>(null);

  // Add new gear dialogs
  const [addingBike, setAddingBike] = useState(false);
  const [addingTire, setAddingTire] = useState(false);
  const [addingShoe, setAddingShoe] = useState(false);
  const [addingRepairKit, setAddingRepairKit] = useState(false);

  // Show All modal state - tracks which category to show (null = closed)
  const [showAllCategory, setShowAllCategory] = useState<ShowAllCategory>(null);

  const supabase = createClient();
  const raceDistanceId = plan.race_distance.id;
  const raceId = plan.race_distance.race_edition.race.id;
  const raceName = plan.race_distance.race_edition.race.name;

  useEffect(() => {
    fetchAllData();
  }, [raceDistanceId]);

  async function fetchAllData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
    await Promise.all([
      fetchInventoryAndSelection(),
      fetchCommunityGear()
    ]);
    setLoading(false);
  }

  async function fetchInventoryAndSelection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's gear inventory
    const [bikesRes, tiresRes, shoesRes, bagsRes, repairKitsRes] = await Promise.all([
      supabase.from("user_bikes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_tires").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_shoes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_bags").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_repair_kits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setInventory({
      bikes: bikesRes.data || [],
      tires: tiresRes.data || [],
      shoes: shoesRes.data || [],
      hydration_packs: [],
      bags: bagsRes.data || [],
      repair_kits: repairKitsRes.data || [],
      clothing: [],
    });

    // Fetch existing selection for THIS user and THIS race
    const { data: existingSelection } = await supabase
      .from("race_gear_selections")
      .select("*")
      .eq("race_distance_id", raceDistanceId)
      .eq("user_id", user.id)
      .single();

    if (existingSelection) {
      setHasExistingSelection(true);
      setSelectedBikeId(existingSelection.bike_id);
      setSelectedFrontTireId(existingSelection.front_tire_id);
      setSelectedRearTireId(existingSelection.rear_tire_id);
      setSelectedShoeId(existingSelection.shoe_id);
      setSelectedRepairKitId(existingSelection.repair_kit_id);
      setIsPublic(existingSelection.is_public);

    } else {
      setHasExistingSelection(false);
    }
  }

  async function fetchCommunityGear() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch ALL gear selections for this race (not just public for counting)
      const { data: allSelections } = await supabase
        .from("race_gear_selections")
        .select(`
          id,
          user_id,
          is_public,
          bike:user_bikes!race_gear_selections_bike_id_fkey (brand, model, year, image_url),
          front_tire:user_tires!race_gear_selections_front_tire_id_fkey (brand, model, width_value, width_unit),
          rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (brand, model, width_value, width_unit),
          shoe:user_shoes!race_gear_selections_shoe_id_fkey (brand, model),
          repair_kit:user_repair_kits!race_gear_selections_repair_kit_id_fkey (name, items)
        `)
        .eq("race_id", raceId);

      if (!allSelections || allSelections.length === 0) {
        setCommunityStats({
          totalWithGear: 0,
          publicCount: 0,
          bikes: [],
          tires: [],
          shoes: [],
          repairKitItems: [],
        });
        setParticipants([]);
        return;
      }

      // Fetch display names for all users with gear
      const userIds = [...new Set(allSelections.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("athlete_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Also fetch from users table as fallback
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      // Build name lookup
      const nameMap = new Map<string, string>();
      users?.forEach(u => {
        nameMap.set(u.id, u.name || u.email?.split("@")[0] || "Athlete");
      });
      profiles?.forEach(p => {
        if (p.display_name) {
          nameMap.set(p.user_id, p.display_name);
        }
      });

      // Filter to public selections for display (exclude current user)
      const publicSelections = allSelections.filter(s =>
        s.is_public && s.user_id !== user?.id
      );

      // Build participant list
      const participantList: ParticipantGear[] = publicSelections.map(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bike = s.bike as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const frontTire = s.front_tire as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rearTire = s.rear_tire as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shoe = s.shoe as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const repairKit = s.repair_kit as any;

        return {
          id: s.id,
          userId: s.user_id,
          displayName: nameMap.get(s.user_id) || "Athlete",
          isPublic: s.is_public,
          bike: bike?.brand ? { brand: bike.brand, model: bike.model, year: bike.year, imageUrl: bike.image_url } : null,
          frontTire: frontTire?.brand ? {
            brand: frontTire.brand,
            model: frontTire.model,
            width: frontTire.width_value ? `${frontTire.width_value}${frontTire.width_unit === "in" ? '"' : 'mm'}` : undefined
          } : null,
          rearTire: rearTire?.brand ? {
            brand: rearTire.brand,
            model: rearTire.model,
            width: rearTire.width_value ? `${rearTire.width_value}${rearTire.width_unit === "in" ? '"' : 'mm'}` : undefined
          } : null,
          shoes: shoe?.brand ? { brand: shoe.brand, model: shoe.model } : null,
          repairKit: repairKit?.name ? { name: repairKit.name, items: repairKit.items || [] } : null,
        };
      });

      setParticipants(participantList);

      // Calculate stats from public selections only
      const totalWithGear = allSelections.length;
      const publicCount = allSelections.filter(s => s.is_public).length;

      // Aggregate bikes (from public selections)
      const bikeMap = new Map<string, number>();
      publicSelections.forEach(s => {
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
          return { brand: brand!, model: model!, count, percentage: Math.round((count / Math.max(publicCount, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate tires
      const tireMap = new Map<string, number>();
      publicSelections.forEach(s => {
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
          return { brand: brand!, model: model!, width: width || undefined, count, percentage: Math.round((count / Math.max(publicCount, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate shoes
      const shoeMap = new Map<string, number>();
      publicSelections.forEach(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shoe = s.shoe as any;
        if (shoe?.brand && shoe?.model) {
          const key = `${shoe.brand}|${shoe.model}`;
          shoeMap.set(key, (shoeMap.get(key) || 0) + 1);
        }
      });

      const shoes: GearAggregation[] = Array.from(shoeMap.entries())
        .map(([key, count]) => {
          const [brand, model] = key.split("|");
          return { brand: brand!, model: model!, count, percentage: Math.round((count / Math.max(publicCount, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate repair kit items
      const repairItemMap = new Map<string, number>();
      publicSelections.forEach(s => {
        const kit = s.repair_kit as { items?: string[] } | null;
        kit?.items?.forEach(item => {
          repairItemMap.set(item, (repairItemMap.get(item) || 0) + 1);
        });
      });

      const repairKitItems = Array.from(repairItemMap.entries())
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count);

      setCommunityStats({
        totalWithGear,
        publicCount,
        bikes,
        tires,
        shoes,
        repairKitItems,
      });

    } catch (error) {
      console.error("Failed to fetch community gear:", error);
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
          shoe_id: selectedShoeId,
          repair_kit_id: selectedRepairKitId,
          is_public: isPublic,
        }),
      });

      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gear selection saved!");
        setHasChanges(false);
        setHasExistingSelection(true);
        // Refresh community stats to include our new data
        fetchCommunityGear();
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
  const selectedShoe = inventory?.shoes.find(s => s.id === selectedShoeId);
  const selectedRepairKit = inventory?.repair_kits.find(k => k.id === selectedRepairKitId);

  // Community insights for selected items
  const bikePopularity = selectedBike ? communityStats?.bikes.find(
    b => b.brand === selectedBike.brand && b.model === selectedBike.model
  ) : null;

  const handleGearAdded = () => {
    setAddingBike(false);
    setAddingTire(false);
    setAddingShoe(false);
    setAddingRepairKit(false);
    fetchInventoryAndSelection();
  };

  const handleSelectionChange = () => {
    setHasChanges(true);
  };

  // Gear completion percentage
  const gearSlots = [selectedBike, selectedFrontTire, selectedRearTire, selectedShoe, selectedRepairKit];
  const filledSlots = gearSlots.filter(Boolean).length;
  const completionPercent = Math.round((filledSlots / gearSlots.length) * 100);

  // Displayed participants (limited to 4 unless expanded)
  const displayedParticipants = showAllParticipants ? participants : participants.slice(0, 4);

  if (loading) {
    return <GearSectionSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-brand-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-brand-sky-400/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Participant Gear</h2>
            <p className="mt-1 text-brand-sky-100/80">
              Your race setup & community insights for {raceName}
            </p>

            {/* Community stats */}
            {communityStats && communityStats.publicCount > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-brand-sky-300" />
                  <span className="text-sm font-medium">
                    {communityStats.publicCount} rider{communityStats.publicCount !== 1 ? "s" : ""} sharing gear
                  </span>
                </div>
                {communityStats.totalWithGear > communityStats.publicCount && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                    <EyeOff className="h-4 w-4 text-white/60" />
                    <span className="text-sm font-medium text-white/60">
                      {communityStats.totalWithGear - communityStats.publicCount} private
                    </span>
                  </div>
                )}
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
          <h3 className="text-lg font-semibold text-brand-navy-900">Your Race Setup</h3>

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

          {/* Shoes */}
          <GearSlotCard
            icon={Footprints}
            label="Shoes"
            description="Race day footwear"
            isEmpty={!selectedShoe}
            onAdd={() => setPickerType("shoes")}
            onRemove={() => { setSelectedShoeId(null); handleSelectionChange(); }}
          >
            {selectedShoe && (
              <SelectedGearDisplay
                title={`${selectedShoe.brand} ${selectedShoe.model}`}
                icon={Footprints}
              />
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
          <CommunityInsightsPanel
            stats={communityStats}
            onShowAllBikes={() => setShowAllCategory("bikes")}
            onShowAllTires={() => setShowAllCategory("tires")}
            onShowAllShoes={() => setShowAllCategory("shoes")}
          />
        </div>
      </div>

      {/* Participant Gear Cards */}
      {participants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-brand-navy-900">
            Rider Setups ({participants.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayedParticipants.map((participant) => (
              <ParticipantGearCard key={participant.id} participant={participant} />
            ))}
          </div>

          {participants.length > 4 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAllParticipants(!showAllParticipants)}
            >
              {showAllParticipants ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All {participants.length} Riders
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Empty Community State */}
      {participants.length === 0 && hasExistingSelection && isPublic && (
        <div className="text-center py-8 px-6 bg-gradient-to-b from-brand-navy-50 to-white rounded-2xl border border-brand-navy-100">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Share2 className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-brand-navy-900">You're a Trailblazer!</h4>
          <p className="mt-2 text-sm text-brand-navy-600 max-w-sm mx-auto">
            You're the first to share your gear for this race. As more riders join, you'll see their setups here.
          </p>
        </div>
      )}

      {/* Share nudge for users with gear set to private */}
      {hasExistingSelection && !isPublic && participants.length > 0 && (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <EyeOff className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">Your gear is private</p>
              <p className="text-sm text-amber-700">Share your setup to help others decide what to bring</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsPublic(true); handleSelectionChange(); }}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Make Public
          </Button>
        </div>
      )}

      {/* Gear Picker Dialog */}
      <Dialog open={pickerType !== null} onOpenChange={(open) => !open && setPickerType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {pickerType === "bike" && <><Bike className="h-5 w-5 text-brand-sky-500" /> Select Bike</>}
              {pickerType === "front_tire" && <><Circle className="h-5 w-5 text-amber-500" /> Select Front Tire</>}
              {pickerType === "rear_tire" && <><Circle className="h-5 w-5 text-amber-500" /> Select Rear Tire</>}
              {pickerType === "shoes" && <><Footprints className="h-5 w-5 text-emerald-500" /> Select Shoes</>}
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

          {/* Shoes Picker */}
          {pickerType === "shoes" && (
            <GearPickerWithInsights
              items={inventory?.shoes || []}
              communityItems={communityStats?.shoes || []}
              selectedId={selectedShoeId}
              onSelect={(id) => {
                setSelectedShoeId(id);
                setPickerType(null);
                handleSelectionChange();
              }}
              onAddNew={() => { setPickerType(null); setAddingShoe(true); }}
              renderItem={(shoe: UserShoe) => (
                <ShoeCard
                  shoe={shoe}
                  selectable
                  selected={selectedShoeId === shoe.id}
                  onSelect={() => {
                    setSelectedShoeId(shoe.id);
                    setPickerType(null);
                    handleSelectionChange();
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}
              getItemKey={(shoe) => `${shoe.brand}|${shoe.model}`}
              emptyMessage="No shoes in your inventory"
            />
          )}

          {/* Repair Kit Picker */}
          {pickerType === "repair_kit" && (
            <div className="space-y-4">
              {(inventory?.repair_kits || []).length > 0 ? (
                <>
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

      <Dialog open={addingShoe} onOpenChange={setAddingShoe}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shoes to Inventory</DialogTitle></DialogHeader>
          <ShoeForm onSave={handleGearAdded} onCancel={() => setAddingShoe(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingRepairKit} onOpenChange={setAddingRepairKit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Repair Kit to Inventory</DialogTitle></DialogHeader>
          <RepairKitForm onSave={handleGearAdded} onCancel={() => setAddingRepairKit(false)} />
        </DialogContent>
      </Dialog>

      {/* Show All Gear Modal - Category Specific */}
      <Dialog open={showAllCategory !== null} onOpenChange={(open) => !open && setShowAllCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showAllCategory === "bikes" && <><Bike className="h-5 w-5 text-brand-sky-500" /> All Bikes for {raceName}</>}
              {showAllCategory === "tires" && <><Circle className="h-5 w-5 text-amber-500" /> All Tires for {raceName}</>}
              {showAllCategory === "shoes" && <><Footprints className="h-5 w-5 text-emerald-500" /> All Shoes for {raceName}</>}
            </DialogTitle>
          </DialogHeader>

          {communityStats && (
            <div className="pt-4">
              {/* All Bikes */}
              {showAllCategory === "bikes" && communityStats.bikes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-brand-navy-500 mb-4">
                    {communityStats.bikes.reduce((sum, b) => sum + b.count, 0)} total selections from {communityStats.publicCount} riders
                  </p>
                  {communityStats.bikes.map((bike, i) => (
                    <div
                      key={`${bike.brand}-${bike.model}-${i}`}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-sky-50 border border-brand-sky-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-sky-100 flex items-center justify-center">
                          <Bike className="h-5 w-5 text-brand-sky-600" />
                        </div>
                        <span className="font-medium text-brand-navy-900">
                          {bike.brand} {bike.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-sky-200/50">
                          <Users className="h-4 w-4 text-brand-sky-700" />
                          <span className="text-sm font-bold text-brand-sky-700">
                            {bike.count}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                          {bike.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Tires */}
              {showAllCategory === "tires" && communityStats.tires.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-brand-navy-500 mb-4">
                    {communityStats.tires.reduce((sum, t) => sum + t.count, 0)} total selections (front + rear)
                  </p>
                  {communityStats.tires.map((tire, i) => (
                    <div
                      key={`${tire.brand}-${tire.model}-${tire.width || ""}-${i}`}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Circle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium text-brand-navy-900">
                            {tire.brand} {tire.model}
                          </span>
                          {tire.width && (
                            <span className="text-brand-navy-500 ml-2">({tire.width})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200/50">
                          <Users className="h-4 w-4 text-amber-700" />
                          <span className="text-sm font-bold text-amber-700">
                            {tire.count}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                          {tire.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Shoes */}
              {showAllCategory === "shoes" && communityStats.shoes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-brand-navy-500 mb-4">
                    {communityStats.shoes.reduce((sum, s) => sum + s.count, 0)} total selections from {communityStats.publicCount} riders
                  </p>
                  {communityStats.shoes.map((shoe, i) => (
                    <div
                      key={`${shoe.brand}-${shoe.model}-${i}`}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Footprints className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-brand-navy-900">
                          {shoe.brand} {shoe.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-200/50">
                          <Users className="h-4 w-4 text-emerald-700" />
                          <span className="text-sm font-bold text-emerald-700">
                            {shoe.count}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                          {shoe.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

// Participant Gear Card
function ParticipantGearCard({ participant }: { participant: ParticipantGear }) {
  const [showBikeImage, setShowBikeImage] = useState(false);
  const hasBike = participant.bike !== null;
  const hasTires = participant.frontTire !== null || participant.rearTire !== null;
  const hasShoes = participant.shoes !== null;
  const hasRepairKit = participant.repairKit !== null;

  return (
    <>
      <div className="rounded-xl border border-brand-navy-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-4 py-3 bg-gradient-to-r from-brand-navy-50 to-brand-sky-50 border-b border-brand-navy-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-bold text-sm">
              {participant.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-brand-navy-900">{participant.displayName}</p>
              <p className="text-xs text-brand-navy-500">
                {[hasBike && "Bike", hasTires && "Tires", hasShoes && "Shoes", hasRepairKit && "Repair Kit"].filter(Boolean).join(" · ") || "Setup"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {participant.bike && (
            <div className="flex items-start gap-3">
              {participant.bike.imageUrl ? (
                <button
                  onClick={() => setShowBikeImage(true)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-brand-navy-100 group cursor-pointer"
                >
                  <img
                    src={participant.bike.imageUrl}
                    alt={`${participant.bike.brand} ${participant.bike.model}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ) : (
                <div className="p-1.5 rounded-md bg-brand-sky-100">
                  <Bike className="h-4 w-4 text-brand-sky-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-navy-900">
                  {participant.bike.brand} {participant.bike.model}
                </p>
                {participant.bike.year && (
                  <p className="text-xs text-brand-navy-500">{participant.bike.year}</p>
                )}
                {participant.bike.imageUrl && (
                  <button
                    onClick={() => setShowBikeImage(true)}
                    className="text-xs text-brand-sky-600 hover:text-brand-sky-700 mt-0.5"
                  >
                    View photo
                  </button>
                )}
              </div>
            </div>
          )}

        {(participant.frontTire || participant.rearTire) && (
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-amber-100">
              <Circle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              {participant.frontTire && (
                <p className="text-sm font-medium text-brand-navy-900">
                  {participant.frontTire.brand} {participant.frontTire.model}
                  {participant.frontTire.width && (
                    <span className="text-brand-navy-400 ml-1">({participant.frontTire.width})</span>
                  )}
                  {participant.rearTire && participant.frontTire.model !== participant.rearTire.model && (
                    <span className="text-xs text-brand-navy-400 ml-1">F</span>
                  )}
                </p>
              )}
              {participant.rearTire && participant.rearTire.model !== participant.frontTire?.model && (
                <p className="text-sm font-medium text-brand-navy-900">
                  {participant.rearTire.brand} {participant.rearTire.model}
                  {participant.rearTire.width && (
                    <span className="text-brand-navy-400 ml-1">({participant.rearTire.width})</span>
                  )}
                  <span className="text-xs text-brand-navy-400 ml-1">R</span>
                </p>
              )}
            </div>
          </div>
        )}

        {participant.shoes && (
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-emerald-100">
              <Footprints className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-navy-900">
                {participant.shoes.brand} {participant.shoes.model}
              </p>
            </div>
          </div>
        )}

        {participant.repairKit && (
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-purple-100">
              <Wrench className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-navy-900">{participant.repairKit.name}</p>
              {participant.repairKit.items.length > 0 && (
                <p className="text-xs text-brand-navy-500 truncate">
                  {participant.repairKit.items.slice(0, 3).join(", ")}
                  {participant.repairKit.items.length > 3 && ` +${participant.repairKit.items.length - 3} more`}
                </p>
              )}
            </div>
          </div>
        )}

        {!hasBike && !hasTires && !hasShoes && !hasRepairKit && (
          <p className="text-sm text-brand-navy-400 italic">No gear details shared</p>
        )}
        </div>
      </div>

      {/* Bike Image Modal */}
      {participant.bike?.imageUrl && (
        <Dialog open={showBikeImage} onOpenChange={setShowBikeImage}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-brand-navy-900 border-brand-navy-700 [&>button]:bg-black/50 [&>button]:text-white [&>button]:border-0 [&>button]:hover:bg-black/70">
            <div className="relative">
              <img
                src={participant.bike.imageUrl}
                alt={`${participant.bike.brand} ${participant.bike.model}`}
                className="w-full h-auto max-h-[70vh] object-contain bg-brand-navy-900"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-lg">
                  {participant.bike.brand} {participant.bike.model}
                </p>
                <p className="text-white/70 text-sm">
                  {participant.displayName}'s race bike{participant.bike.year ? ` • ${participant.bike.year}` : ''}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
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
function CommunityInsightsPanel({
  stats,
  onShowAllBikes,
  onShowAllTires,
  onShowAllShoes,
}: {
  stats: CommunityStats | null;
  onShowAllBikes?: () => void;
  onShowAllTires?: () => void;
  onShowAllShoes?: () => void;
}) {
  if (!stats || stats.publicCount === 0) {
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
      <h3 className="text-lg font-semibold text-brand-navy-900">Popular Choices</h3>

      {/* Popular Bikes */}
      {stats.bikes.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-brand-sky-50 border-b border-brand-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-brand-sky-600" />
                <h4 className="font-semibold text-brand-sky-900 text-sm">Bikes</h4>
              </div>
              {onShowAllBikes && stats.bikes.length > 3 && (
                <button
                  onClick={onShowAllBikes}
                  className="text-xs font-medium text-brand-sky-600 hover:text-brand-sky-700"
                >
                  Show All ({stats.bikes.length})
                </button>
              )}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-amber-600" />
                <h4 className="font-semibold text-amber-900 text-sm">Tires</h4>
              </div>
              {onShowAllTires && stats.tires.length > 3 && (
                <button
                  onClick={onShowAllTires}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  Show All ({stats.tires.length})
                </button>
              )}
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

      {/* Popular Shoes */}
      {stats.shoes.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900 text-sm">Shoes</h4>
              </div>
              {onShowAllShoes && stats.shoes.length > 3 && (
                <button
                  onClick={onShowAllShoes}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Show All ({stats.shoes.length})
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.shoes.slice(0, 3).map((shoe, i) => (
              <div key={`${shoe.brand}-${shoe.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {shoe.brand} {shoe.model}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {shoe.count} rider{shoe.count !== 1 ? "s" : ""}
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
  const getPopularity = (item: T) => {
    const key = getItemKey(item);
    return communityItems.find(c => `${c.brand}|${c.model}` === key);
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
