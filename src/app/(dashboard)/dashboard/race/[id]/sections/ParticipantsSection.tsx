"use client";

import { useState, useEffect } from "react";
import { Users, Bike, Circle, Wrench, Eye, EyeOff, ChevronRight, Sparkles, TrendingUp, Share2 } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface RaceDistance {
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
}

interface RacePlan {
  id: string;
  user_id: string;
  race_distance: RaceDistance;
}

interface ParticipantsSectionProps {
  plan: RacePlan;
  onNavigateToGear?: () => void;
}

interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

interface CommunityGearStats {
  totalParticipants: number;
  sharingGear: number;
  bikes: GearAggregation[];
  tires: GearAggregation[];
  repairKits: { item: string; count: number }[];
}

interface UserGearStatus {
  hasGear: boolean;
  isPublic: boolean;
  hasBike: boolean;
  hasTires: boolean;
  hasRepairKit: boolean;
}

export function ParticipantsSection({ plan, onNavigateToGear }: ParticipantsSectionProps) {
  const distance = plan.race_distance;
  const [stats, setStats] = useState<CommunityGearStats | null>(null);
  const [userGearStatus, setUserGearStatus] = useState<UserGearStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const raceId = distance?.race_edition?.race?.id;

  useEffect(() => {
    if (distance?.id && raceId) {
      fetchCommunityGear();
    }
  }, [distance?.id, raceId]);

  async function fetchCommunityGear() {
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all public gear selections for this race
      const { data: gearSelections } = await supabase
        .from("race_gear_selections")
        .select(`
          id,
          user_id,
          is_public,
          bike:user_bikes!race_gear_selections_bike_id_fkey (
            brand,
            model,
            year
          ),
          front_tire:user_tires!race_gear_selections_front_tire_id_fkey (
            brand,
            model,
            width_value,
            width_unit
          ),
          rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (
            brand,
            model,
            width_value,
            width_unit
          ),
          repair_kit:user_repair_kits!race_gear_selections_repair_kit_id_fkey (
            name,
            items
          )
        `)
        .eq("race_id", raceId);

      // Count total participants from race plans
      const { count: totalPlans } = await supabase
        .from("race_plans")
        .select("*", { count: "exact", head: true })
        .eq("race_distance_id", distance.id);

      // Check current user's gear status
      if (user) {
        const userSelection = gearSelections?.find(s => s.user_id === user.id);
        setUserGearStatus({
          hasGear: !!userSelection,
          isPublic: userSelection?.is_public ?? false,
          hasBike: !!userSelection?.bike,
          hasTires: !!(userSelection?.front_tire || userSelection?.rear_tire),
          hasRepairKit: !!userSelection?.repair_kit,
        });
      }

      // Filter to public gear only for stats
      const publicGear = gearSelections?.filter(s => s.is_public) || [];

      // Aggregate bike stats
      const bikeMap = new Map<string, number>();
      publicGear.forEach(s => {
        if (s.bike) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bike = s.bike as any;
          if (bike?.brand && bike?.model) {
            const key = `${bike.brand}|${bike.model}`;
            bikeMap.set(key, (bikeMap.get(key) || 0) + 1);
          }
        }
      });

      const bikes: GearAggregation[] = Array.from(bikeMap.entries())
        .map(([key, count]) => {
          const [brand, model] = key.split("|");
          return {
            brand: brand || "Unknown",
            model: model || "Unknown",
            count,
            percentage: Math.round((count / Math.max(publicGear.length, 1)) * 100),
          };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate tire stats (combine front and rear)
      const tireMap = new Map<string, number>();
      publicGear.forEach(s => {
        [s.front_tire, s.rear_tire].forEach(tire => {
          if (tire) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const t = tire as any;
            if (t?.brand && t?.model) {
              const width = t.width_value ? `${t.width_value}${t.width_unit === "in" ? '"' : 'mm'}` : "";
              const key = `${t.brand}|${t.model}|${width}`;
              tireMap.set(key, (tireMap.get(key) || 0) + 1);
            }
          }
        });
      });

      const tires: GearAggregation[] = Array.from(tireMap.entries())
        .map(([key, count]) => {
          const [brand, model, width] = key.split("|");
          return { brand: brand || "Unknown", model: model || "Unknown", width: width || undefined, count, percentage: Math.round((count / Math.max(publicGear.length, 1)) * 100) };
        })
        .sort((a, b) => b.count - a.count);

      // Aggregate repair kit items
      const repairItemMap = new Map<string, number>();
      publicGear.forEach(s => {
        if (s.repair_kit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const kit = s.repair_kit as any;
          const items = kit?.items as string[] | undefined;
          items?.forEach(item => {
            repairItemMap.set(item, (repairItemMap.get(item) || 0) + 1);
          });
        }
      });

      const repairKits = Array.from(repairItemMap.entries())
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalParticipants: totalPlans || 0,
        sharingGear: publicGear.length,
        bikes,
        tires,
        repairKits,
      });

    } catch (error) {
      console.error("Error fetching community gear:", error);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const hasNoParticipants = !stats || stats.totalParticipants <= 1;
  const hasNoGearData = !stats || stats.sharingGear === 0;
  const userNeedsToShareGear = userGearStatus && (!userGearStatus.hasGear || !userGearStatus.isPublic);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Community Gear</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            See what other athletes are running at {distance?.race_edition?.race?.name}
          </p>
        </div>
      </div>

      {/* Gear Nudge Banner - Show if user hasn't shared gear */}
      {userNeedsToShareGear && (
        <GearNudgeBanner
          userGearStatus={userGearStatus}
          participantsSharing={stats?.sharingGear || 0}
          totalParticipants={stats?.totalParticipants || 0}
          onAddGear={onNavigateToGear}
        />
      )}

      {/* Stats Cards */}
      {stats && stats.totalParticipants > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Participants"
            value={stats.totalParticipants}
            sublabel="registered for this distance"
            color="sky"
          />
          <StatCard
            icon={Eye}
            label="Sharing Gear"
            value={stats.sharingGear}
            sublabel="public gear setups"
            color="green"
            highlight={stats.sharingGear > 0}
          />
          <StatCard
            icon={EyeOff}
            label="Private"
            value={stats.totalParticipants - stats.sharingGear}
            sublabel="haven't shared yet"
            color="gray"
          />
        </div>
      )}

      {/* Empty State */}
      {hasNoParticipants && (
        <EmptyState
          icon={Users}
          title="Be the first!"
          description="You're among the first to create a plan for this race. Share your gear to help others decide what to bring."
          action={onNavigateToGear ? { label: "Share Your Gear", onClick: onNavigateToGear } : undefined}
        />
      )}

      {/* No Gear Data State */}
      {!hasNoParticipants && hasNoGearData && (
        <EmptyState
          icon={Sparkles}
          title="No gear shared yet"
          description={`${stats?.totalParticipants || 0} athletes have plans for this race, but no one has shared their gear publicly yet. Be the first!`}
          action={onNavigateToGear ? { label: "Share Your Gear", onClick: onNavigateToGear } : undefined}
        />
      )}

      {/* Gear Stats */}
      {stats && stats.sharingGear > 0 && (
        <div className="space-y-6">
          {/* Popular Bikes */}
          {stats.bikes.length > 0 && (
            <GearStatsSection
              title="Popular Bikes"
              icon={<Bike className="h-5 w-5" />}
              description="What bikes are people racing on"
              items={stats.bikes.slice(0, 5)}
              totalSharing={stats.sharingGear}
              color="sky"
            />
          )}

          {/* Popular Tires */}
          {stats.tires.length > 0 && (
            <GearStatsSection
              title="Popular Tires"
              icon={<Circle className="h-5 w-5" />}
              description="Tire choices for this course"
              items={stats.tires.slice(0, 5)}
              totalSharing={stats.sharingGear}
              color="amber"
            />
          )}

          {/* Repair Kit Essentials */}
          {stats.repairKits.length > 0 && (
            <RepairKitSection
              items={stats.repairKits.slice(0, 10)}
              totalSharing={stats.sharingGear}
            />
          )}
        </div>
      )}

      {/* Social Proof Footer */}
      {stats && stats.sharingGear > 0 && !userGearStatus?.isPublic && (
        <SocialProofFooter
          sharingCount={stats.sharingGear}
          onShare={onNavigateToGear}
        />
      )}
    </div>
  );
}

// Gear Nudge Banner - Compelling CTA to share gear
function GearNudgeBanner({
  userGearStatus,
  participantsSharing,
  totalParticipants,
  onAddGear,
}: {
  userGearStatus: UserGearStatus;
  participantsSharing: number;
  totalParticipants: number;
  onAddGear?: () => void;
}) {
  const percentSharing = totalParticipants > 0 ? Math.round((participantsSharing / totalParticipants) * 100) : 0;

  // Different messages based on user's gear status
  let title: string;
  let description: string;

  if (!userGearStatus.hasGear) {
    title = "Help others decide what to bring";
    description = "Share your bike, tires, and repair kit so other racers can see what the community is running.";
  } else if (!userGearStatus.isPublic) {
    title = "Your gear is set to private";
    description = "Make your gear selection public to help other athletes make informed decisions.";
  } else if (!userGearStatus.hasBike || !userGearStatus.hasTires) {
    title = "Complete your gear setup";
    description = `You're missing ${!userGearStatus.hasBike ? "your bike" : ""}${!userGearStatus.hasBike && !userGearStatus.hasTires ? " and " : ""}${!userGearStatus.hasTires ? "tire selection" : ""}. Add them to help the community!`;
  } else {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900 p-6 text-white shadow-xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-brand-sky-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-brand-sky-400/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Share2 className="h-6 w-6 text-brand-sky-300" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-white">
              {title}
            </h4>
            <p className="mt-1 text-sm text-brand-sky-100/80">
              {description}
            </p>

            {participantsSharing > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-sky-200">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {participantsSharing} athlete{participantsSharing !== 1 ? "s" : ""} already sharing
                </span>
                {percentSharing > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10">
                    {percentSharing}% of racers
                  </span>
                )}
              </div>
            )}
          </div>

          {onAddGear && (
            <Button
              onClick={onAddGear}
              className="flex-shrink-0 bg-white text-brand-navy-900 hover:bg-brand-sky-50 shadow-lg"
            >
              {!userGearStatus.hasGear ? "Add Gear" : "Update Gear"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sublabel: string;
  color: "sky" | "green" | "gray";
  highlight?: boolean;
}) {
  const colorClasses = {
    sky: { bg: "bg-brand-sky-50", border: "border-brand-sky-100", icon: "text-brand-sky-500", text: "text-brand-sky-700", value: "text-brand-sky-900" },
    green: { bg: "bg-green-50", border: "border-green-100", icon: "text-green-500", text: "text-green-700", value: "text-green-900" },
    gray: { bg: "bg-brand-navy-50", border: "border-brand-navy-100", icon: "text-brand-navy-400", text: "text-brand-navy-600", value: "text-brand-navy-700" },
  };
  const c = colorClasses[color];

  return (
    <div className={cn("p-4 rounded-xl border transition-all", c.bg, c.border, highlight && "ring-2 ring-green-300 ring-offset-2")}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-5 w-5", c.icon)} />
        <span className={cn("text-sm font-medium", c.text)}>{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", c.value)}>{value}</p>
      <p className={cn("text-xs", c.text)}>{sublabel}</p>
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-12 px-6 bg-gradient-to-b from-brand-navy-50 to-white rounded-2xl border border-brand-navy-100">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-navy-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-brand-navy-400" />
      </div>
      <h4 className="text-lg font-semibold text-brand-navy-900">{title}</h4>
      <p className="mt-2 text-sm text-brand-navy-600 max-w-sm mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

// Gear Stats Section
function GearStatsSection({
  title,
  icon,
  description,
  items,
  totalSharing,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  items: GearAggregation[];
  totalSharing: number;
  color: "sky" | "amber";
}) {
  const topCount = items[0]?.count || 1;

  const colorClasses = {
    sky: { iconBg: "bg-brand-sky-100", iconText: "text-brand-sky-600", bar: "bg-brand-sky-500" },
    amber: { iconBg: "bg-amber-100", iconText: "text-amber-600", bar: "bg-amber-500" },
  };
  const c = colorClasses[color];

  return (
    <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
      <div className="px-5 py-4 bg-brand-navy-50 border-b border-brand-navy-200">
        <div className="flex items-center gap-3">
          <span className={cn("p-2 rounded-lg", c.iconBg, c.iconText)}>
            {icon}
          </span>
          <div>
            <h4 className="font-semibold text-brand-navy-900">{title}</h4>
            <p className="text-xs text-brand-navy-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {items.map((item, index) => (
          <div key={`${item.brand}-${item.model}-${item.width || ""}-${index}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-brand-navy-900 truncate">
                  {item.brand} {item.model}
                </span>
                {item.width && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-brand-navy-500 bg-brand-navy-100 rounded-md">
                    {item.width}
                  </span>
                )}
              </div>
              <span className="flex-shrink-0 text-sm font-medium text-brand-navy-600 tabular-nums">
                {item.count} rider{item.count !== 1 ? "s" : ""}
                <span className="ml-1.5 text-brand-navy-400">
                  ({Math.round((item.count / totalSharing) * 100)}%)
                </span>
              </span>
            </div>
            <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", c.bar)}
                style={{ width: `${(item.count / topCount) * 100}%`, opacity: 1 - index * 0.12 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Repair Kit Section
function RepairKitSection({
  items,
  totalSharing,
}: {
  items: { item: string; count: number }[];
  totalSharing: number;
}) {
  return (
    <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
      <div className="px-5 py-4 bg-brand-navy-50 border-b border-brand-navy-200">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <h4 className="font-semibold text-brand-navy-900">Repair Kit Essentials</h4>
            <p className="text-xs text-brand-navy-500">Most common items athletes are carrying</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {items.map(({ item, count }) => {
            const percent = Math.round((count / totalSharing) * 100);
            return (
              <div
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100"
              >
                <span className="text-sm font-medium text-purple-900">{item}</span>
                <span className="text-xs font-medium text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Social Proof Footer
function SocialProofFooter({
  sharingCount,
  onShare,
}: {
  sharingCount: number;
  onShare?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {[...Array(Math.min(sharingCount, 4))].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          {sharingCount > 4 && (
            <div className="w-8 h-8 rounded-full bg-brand-navy-200 border-2 border-white flex items-center justify-center text-brand-navy-600 text-xs font-bold">
              +{sharingCount - 4}
            </div>
          )}
        </div>
        <p className="text-sm text-green-800">
          <span className="font-semibold">{sharingCount} athlete{sharingCount !== 1 ? "s" : ""}</span> sharing gear to help the community
        </p>
      </div>

      {onShare && (
        <Button variant="outline" size="sm" onClick={onShare} className="border-green-300 text-green-700 hover:bg-green-100">
          Join them
        </Button>
      )}
    </div>
  );
}
