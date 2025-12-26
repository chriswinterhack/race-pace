"use client";

import { useState, useEffect } from "react";
import { Bike, Circle, Wrench, Plus, ChevronDown, ChevronUp, Share2, Footprints, EyeOff } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BikeCard, BikeForm } from "@/components/gear/inventory";
import { TireCard, TireForm } from "@/components/gear/inventory";
import { RepairKitCard, RepairKitForm } from "@/components/gear/inventory";
import { ShoeCard, ShoeForm } from "@/components/gear/inventory";
import type { UserBike, UserTire, UserShoe, UserGearInventory } from "@/types/gear";
import { usePremiumFeature } from "@/hooks/useSubscription";
import {
  GearSectionSkeleton,
  GearSlotCard,
  SelectedGearDisplay,
  ParticipantGearCard,
  CommunityInsightsPanel,
  CommunityInsightsLocked,
  GearPickerWithInsights,
  EmptyInventoryState,
  GearSectionHeader,
  ShowAllGearModal,
  GearSetupPrompt,
  GearSavedPrompt,
  type ParticipantGear,
  type CommunityStats,
  type ShowAllCategory,
  type GearPickerType,
  type GearAggregation,
} from "@/components/participant-gear";

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

export function ParticipantGearSection({ plan }: ParticipantGearSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<UserGearInventory | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [startedAddingGear, setStartedAddingGear] = useState(false);

  const { canAccess: isPremium, showUpgrade } = usePremiumFeature("Community Gear Insights");

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

  // Show All modal state
  const [showAllCategory, setShowAllCategory] = useState<ShowAllCategory>(null);

  const supabase = createClient();
  const raceDistanceId = plan.race_distance.id;
  const raceId = plan.race_distance.race_edition.race.id;
  const raceName = plan.race_distance.race_edition.race.name;

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceDistanceId]);

  async function fetchAllData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
    await Promise.all([fetchInventoryAndSelection(), fetchCommunityGear()]);
    setLoading(false);
  }

  async function fetchInventoryAndSelection() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: allSelections } = await supabase
        .from("race_gear_selections")
        .select(
          `
          id,
          user_id,
          is_public,
          bike:user_bikes!race_gear_selections_bike_id_fkey (brand, model, year, image_url),
          front_tire:user_tires!race_gear_selections_front_tire_id_fkey (brand, model, width_value, width_unit),
          rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (brand, model, width_value, width_unit),
          shoe:user_shoes!race_gear_selections_shoe_id_fkey (brand, model),
          repair_kit:user_repair_kits!race_gear_selections_repair_kit_id_fkey (name, items)
        `
        )
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

      const userIds = [...new Set(allSelections.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("athlete_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);

      const nameMap = new Map<string, string>();
      users?.forEach((u) => {
        nameMap.set(u.id, u.name || u.email?.split("@")[0] || "Athlete");
      });
      profiles?.forEach((p) => {
        if (p.display_name) {
          nameMap.set(p.user_id, p.display_name);
        }
      });

      const publicSelections = allSelections.filter((s) => s.is_public && s.user_id !== user?.id);

      const participantList: ParticipantGear[] = publicSelections.map((s) => {
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
          bike: bike?.brand
            ? { brand: bike.brand, model: bike.model, year: bike.year, imageUrl: bike.image_url }
            : null,
          frontTire: frontTire?.brand
            ? {
                brand: frontTire.brand,
                model: frontTire.model,
                width: frontTire.width_value
                  ? `${frontTire.width_value}${frontTire.width_unit === "in" ? '"' : "mm"}`
                  : undefined,
              }
            : null,
          rearTire: rearTire?.brand
            ? {
                brand: rearTire.brand,
                model: rearTire.model,
                width: rearTire.width_value
                  ? `${rearTire.width_value}${rearTire.width_unit === "in" ? '"' : "mm"}`
                  : undefined,
              }
            : null,
          shoes: shoe?.brand ? { brand: shoe.brand, model: shoe.model } : null,
          repairKit: repairKit?.name ? { name: repairKit.name, items: repairKit.items || [] } : null,
        };
      });

      setParticipants(participantList);

      const stats = calculateCommunityStats(allSelections, publicSelections);
      setCommunityStats(stats);
    } catch (error) {
      console.error("Failed to fetch community gear:", error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function calculateCommunityStats(allSelections: any[], publicSelections: any[]): CommunityStats {
    const totalWithGear = allSelections.length;
    const publicCount = allSelections.filter((s) => s.is_public).length;

    const bikeMap = new Map<string, number>();
    publicSelections.forEach((s) => {
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

    const tireMap = new Map<string, number>();
    publicSelections.forEach((s) => {
      [s.front_tire, s.rear_tire].forEach((tire) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = tire as any;
        if (t?.brand && t?.model) {
          const width = t.width_value ? `${t.width_value}${t.width_unit === "in" ? '"' : "mm"}` : "";
          const key = `${t.brand}|${t.model}|${width}`;
          tireMap.set(key, (tireMap.get(key) || 0) + 1);
        }
      });
    });

    const tires: GearAggregation[] = Array.from(tireMap.entries())
      .map(([key, count]) => {
        const [brand, model, width] = key.split("|");
        return {
          brand: brand!,
          model: model!,
          width: width || undefined,
          count,
          percentage: Math.round((count / Math.max(publicCount, 1)) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);

    const shoeMap = new Map<string, number>();
    publicSelections.forEach((s) => {
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

    const repairItemMap = new Map<string, number>();
    publicSelections.forEach((s) => {
      const kit = s.repair_kit as { items?: string[] } | null;
      kit?.items?.forEach((item) => {
        repairItemMap.set(item, (repairItemMap.get(item) || 0) + 1);
      });
    });

    const repairKitItems = Array.from(repairItemMap.entries())
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count);

    return { totalWithGear, publicCount, bikes, tires, shoes, repairKitItems };
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
        setJustSaved(true);
        fetchCommunityGear();
      }
    } catch {
      toast.error("Failed to save gear selection");
    }
    setSaving(false);
  }

  const selectedBike = inventory?.bikes.find((b) => b.id === selectedBikeId);
  const selectedFrontTire = inventory?.tires.find((t) => t.id === selectedFrontTireId);
  const selectedRearTire = inventory?.tires.find((t) => t.id === selectedRearTireId);
  const selectedShoe = inventory?.shoes.find((s) => s.id === selectedShoeId);
  const selectedRepairKit = inventory?.repair_kits.find((k) => k.id === selectedRepairKitId);

  const bikePopularity = selectedBike
    ? communityStats?.bikes.find((b) => b.brand === selectedBike.brand && b.model === selectedBike.model)
    : null;

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

  const gearSlots = [selectedBike, selectedFrontTire, selectedRearTire, selectedShoe, selectedRepairKit];
  const filledSlots = gearSlots.filter(Boolean).length;
  const completionPercent = Math.round((filledSlots / gearSlots.length) * 100);

  const displayedParticipants = showAllParticipants ? participants : participants.slice(0, 4);

  if (loading) {
    return <GearSectionSkeleton />;
  }

  // Determine if user has never added any gear to this race
  const hasNoGearSelected = !selectedBikeId && !selectedFrontTireId && !selectedRearTireId && !selectedShoeId && !selectedRepairKitId;
  const showSetupPrompt = hasNoGearSelected && !hasExistingSelection && !startedAddingGear;

  return (
    <div className="space-y-8">
      {/* Show saved success prompt */}
      {justSaved && (
        <GearSavedPrompt
          isPublic={isPublic}
          participantCount={communityStats?.publicCount || 0}
          onTogglePublic={() => {
            setIsPublic(!isPublic);
            handleSelectionChange();
          }}
          onDismiss={() => setJustSaved(false)}
        />
      )}

      {/* Show setup prompt if no gear yet */}
      {showSetupPrompt && !justSaved && (
        <GearSetupPrompt
          raceName={raceName}
          participantCount={communityStats?.publicCount || 0}
          onGetStarted={() => setStartedAddingGear(true)}
          isPremium={isPremium}
        />
      )}

      {/* Hide main content if showing setup prompt */}
      {!showSetupPrompt && (
        <>
          <GearSectionHeader
            raceName={raceName}
            communityStats={communityStats}
            completionPercent={completionPercent}
            isPublic={isPublic}
            hasChanges={hasChanges}
            saving={saving}
            onTogglePublic={() => {
              setIsPublic(!isPublic);
              handleSelectionChange();
            }}
            onSave={handleSave}
            isPremium={true} // All users can save their gear
          />

          {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Setup - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-brand-navy-900">Your Race Setup</h3>

          <GearSlotCard
            icon={Bike}
            label="Bike"
            description="Your race machine"
            isEmpty={!selectedBike}
            popularity={bikePopularity}
            onAdd={() => setPickerType("bike")}
            onRemove={() => {
              setSelectedBikeId(null);
              handleSelectionChange();
            }}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <GearSlotCard
              icon={Circle}
              label="Front Tire"
              description="Leading grip"
              isEmpty={!selectedFrontTire}
              onAdd={() => setPickerType("front_tire")}
              onRemove={() => {
                setSelectedFrontTireId(null);
                handleSelectionChange();
              }}
              compact
            >
              {selectedFrontTire && (
                <SelectedGearDisplay
                  title={`${selectedFrontTire.brand} ${selectedFrontTire.model}`}
                  subtitle={`${selectedFrontTire.width_value}${selectedFrontTire.width_unit === "in" ? '"' : "mm"}`}
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
              onRemove={() => {
                setSelectedRearTireId(null);
                handleSelectionChange();
              }}
              compact
            >
              {selectedRearTire && (
                <SelectedGearDisplay
                  title={`${selectedRearTire.brand} ${selectedRearTire.model}`}
                  subtitle={`${selectedRearTire.width_value}${selectedRearTire.width_unit === "in" ? '"' : "mm"}`}
                  icon={Circle}
                  compact
                />
              )}
            </GearSlotCard>
          </div>

          <GearSlotCard
            icon={Footprints}
            label="Shoes"
            description="Race day footwear"
            isEmpty={!selectedShoe}
            onAdd={() => setPickerType("shoes")}
            onRemove={() => {
              setSelectedShoeId(null);
              handleSelectionChange();
            }}
          >
            {selectedShoe && (
              <SelectedGearDisplay title={`${selectedShoe.brand} ${selectedShoe.model}`} icon={Footprints} />
            )}
          </GearSlotCard>

          <GearSlotCard
            icon={Wrench}
            label="Repair Kit"
            description="Emergency essentials"
            isEmpty={!selectedRepairKit}
            onAdd={() => setPickerType("repair_kit")}
            onRemove={() => {
              setSelectedRepairKitId(null);
              handleSelectionChange();
            }}
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
          {isPremium ? (
            <CommunityInsightsPanel
              stats={communityStats}
              onShowAllBikes={() => setShowAllCategory("bikes")}
              onShowAllTires={() => setShowAllCategory("tires")}
              onShowAllShoes={() => setShowAllCategory("shoes")}
            />
          ) : (
            <CommunityInsightsLocked
              participantCount={communityStats?.publicCount || 0}
              onUpgrade={showUpgrade}
            />
          )}
        </div>
      </div>

      {/* Participant Gear Cards - Premium Only */}
      {participants.length > 0 && isPremium && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-brand-navy-900">Rider Setups ({participants.length})</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayedParticipants.map((participant) => (
              <ParticipantGearCard key={participant.id} participant={participant} />
            ))}
          </div>

          {participants.length > 4 && (
            <Button variant="outline" className="w-full" onClick={() => setShowAllParticipants(!showAllParticipants)}>
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

      {/* Rider Setups Teaser for Free Users */}
      {participants.length > 0 && !isPremium && (
        <div className="relative rounded-2xl border border-brand-navy-200 overflow-hidden">
          {/* Blurred preview of cards */}
          <div className="p-6 filter blur-[3px] pointer-events-none select-none">
            <h3 className="text-lg font-semibold text-brand-navy-900 mb-4">Rider Setups ({participants.length})</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-brand-navy-100 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy-200" />
                    <div className="h-4 w-24 bg-brand-navy-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-brand-navy-100 rounded" />
                    <div className="h-3 w-28 bg-brand-navy-100 rounded" />
                    <div className="h-3 w-24 bg-brand-navy-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center px-6">
              <p className="text-lg font-semibold text-brand-navy-900 mb-2">
                {participants.length} riders shared their setups
              </p>
              <p className="text-sm text-brand-navy-600 mb-4">
                Upgrade to see exactly what gear they&apos;re running
              </p>
              <Button onClick={showUpgrade} className="gap-2">
                <Bike className="h-4 w-4" />
                Unlock Rider Setups
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Community State - Premium Only */}
      {participants.length === 0 && hasExistingSelection && isPublic && isPremium && (
        <div className="text-center py-8 px-6 bg-gradient-to-b from-brand-navy-50 to-white rounded-2xl border border-brand-navy-100">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Share2 className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-brand-navy-900">You&apos;re a Trailblazer!</h4>
          <p className="mt-2 text-sm text-brand-navy-600 max-w-sm mx-auto">
            You&apos;re the first to share your gear for this race. As more riders join, you&apos;ll see their setups
            here.
          </p>
        </div>
      )}

      {/* Share nudge for users with gear set to private - Premium Only */}
      {hasExistingSelection && !isPublic && participants.length > 0 && isPremium && (
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
            onClick={() => {
              setIsPublic(true);
              handleSelectionChange();
            }}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Make Public
          </Button>
        </div>
      )}
      </>
    )}

      {/* Gear Picker Dialog */}
      <Dialog open={pickerType !== null} onOpenChange={(open) => !open && setPickerType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {pickerType === "bike" && (
                <>
                  <Bike className="h-5 w-5 text-brand-sky-500" /> Select Bike
                </>
              )}
              {pickerType === "front_tire" && (
                <>
                  <Circle className="h-5 w-5 text-amber-500" /> Select Front Tire
                </>
              )}
              {pickerType === "rear_tire" && (
                <>
                  <Circle className="h-5 w-5 text-amber-500" /> Select Rear Tire
                </>
              )}
              {pickerType === "shoes" && (
                <>
                  <Footprints className="h-5 w-5 text-emerald-500" /> Select Shoes
                </>
              )}
              {pickerType === "repair_kit" && (
                <>
                  <Wrench className="h-5 w-5 text-purple-500" /> Select Repair Kit
                </>
              )}
            </DialogTitle>
          </DialogHeader>

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
              onAddNew={() => {
                setPickerType(null);
                setAddingBike(true);
              }}
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
              onAddNew={() => {
                setPickerType(null);
                setAddingTire(true);
              }}
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
              onAddNew={() => {
                setPickerType(null);
                setAddingTire(true);
              }}
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
              onAddNew={() => {
                setPickerType(null);
                setAddingShoe(true);
              }}
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPickerType(null);
                        setAddingRepairKit(true);
                      }}
                      className="w-full gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Repair Kit
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyInventoryState
                  onAdd={() => {
                    setPickerType(null);
                    setAddingRepairKit(true);
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Gear Dialogs */}
      <Dialog open={addingBike} onOpenChange={setAddingBike}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bike to Inventory</DialogTitle>
          </DialogHeader>
          <BikeForm onSave={handleGearAdded} onCancel={() => setAddingBike(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingTire} onOpenChange={setAddingTire}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tire to Inventory</DialogTitle>
          </DialogHeader>
          <TireForm onSave={handleGearAdded} onCancel={() => setAddingTire(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingShoe} onOpenChange={setAddingShoe}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shoes to Inventory</DialogTitle>
          </DialogHeader>
          <ShoeForm onSave={handleGearAdded} onCancel={() => setAddingShoe(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addingRepairKit} onOpenChange={setAddingRepairKit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repair Kit to Inventory</DialogTitle>
          </DialogHeader>
          <RepairKitForm onSave={handleGearAdded} onCancel={() => setAddingRepairKit(false)} />
        </DialogContent>
      </Dialog>

      <ShowAllGearModal
        category={showAllCategory}
        raceName={raceName}
        communityStats={communityStats}
        onClose={() => setShowAllCategory(null)}
      />
    </div>
  );
}
