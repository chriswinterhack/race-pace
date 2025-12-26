"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Bike,
  Clock,
  TrendingUp,
  Loader2,
  ArrowRight,
  Sparkles,
  X,
  MapPin,
  Wrench,
  Droplets,
  Footprints,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type DiscussionCategory,
} from "@/types/discussions";

// Types
interface CommunityStats {
  athlete_count: number;
  discussion_count: number;
  gear_share_count: number;
}

interface ActivityItem {
  type: "discussion" | "gear_share";
  id?: string;
  title?: string;
  category?: string;
  race_id: string;
  race_name: string;
  race_slug: string;
  user_name: string;
  user_avatar?: string | null;
  created_at: string;
}

interface GearSetup {
  id: string;
  notes?: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  race: {
    id: string;
    name: string;
    slug: string;
    location?: string;
    year?: number;
    distance: {
      name?: string;
      miles?: number;
    };
  };
  bike?: {
    brand: string;
    model: string;
    year?: number;
    bike_type?: string;
    image_url?: string;
  };
  front_tire?: {
    brand: string;
    model: string;
    width_value?: number;
    width_unit?: string;
    tire_type?: string;
  };
  rear_tire?: {
    brand: string;
    model: string;
    width_value?: number;
    width_unit?: string;
    tire_type?: string;
  };
  shoe?: {
    brand: string;
    model: string;
    shoe_type?: string;
  };
  hydration_pack?: {
    brand: string;
    model: string;
    capacity_liters?: number;
  };
  repair_kit?: {
    name: string;
    items?: string[];
  };
  bags?: Array<{
    brand: string;
    model: string;
    bag_type?: string;
    capacity_liters?: number;
  }>;
}

interface GearItem {
  brand: string;
  model: string;
  count: number;
  percentage: number;
}

interface TrendingGear {
  bikes: GearItem[];
  tires: GearItem[];
  shoes: GearItem[];
  hydration_packs: GearItem[];
  total_selections: number;
}

interface DiscussionPreview {
  id: string;
  title: string;
  category: DiscussionCategory;
  reply_count: number;
  is_pinned: boolean;
  last_activity_at: string;
  created_at: string;
  race: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    name: string;
    avatar_url: string | null;
  };
}

export default function CommunityPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trendingGear, setTrendingGear] = useState<TrendingGear | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGearSetup, setSelectedGearSetup] = useState<GearSetup | null>(null);
  const [loadingGearSetup, setLoadingGearSetup] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  async function handleViewGearSetup(selectionId: string) {
    setLoadingGearSetup(true);
    try {
      const res = await fetch(`/api/community/gear/${selectionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedGearSetup(data.data);
      }
    } catch (error) {
      console.error("Error fetching gear setup:", error);
    }
    setLoadingGearSetup(false);
  }

  async function fetchCommunityData() {
    setLoading(true);

    // Fetch all data in parallel
    const [statsRes, activityRes, gearRes, discussionsRes] = await Promise.all([
      fetch("/api/community/stats"),
      fetch("/api/community/activity"),
      fetch("/api/community/gear/trending"),
      fetch("/api/community/discussions/recent"),
    ]);

    if (statsRes.ok) {
      const data = await statsRes.json();
      setStats(data);
    }

    if (activityRes.ok) {
      const data = await activityRes.json();
      setActivities(data.activities || []);
    }

    if (gearRes.ok) {
      const data = await gearRes.json();
      setTrendingGear(data);
    }

    if (discussionsRes.ok) {
      const data = await discussionsRes.json();
      setDiscussions(data.discussions || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                Athlete Hub
              </h1>
              <p className="text-white/90">Connect with fellow athletes</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Live Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 p-6 sm:p-8">
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='24' viewBox='0 0 88 24'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M10 0l-5.5 9h11L10 0zm0 5.07L12.81 9H7.19L10 5.07zM0 18l5.5-9h-11L0 18zm0-5.07L-2.81 9h5.62L0 12.93zM20 6l-5.5 9h11L20 6zm0 5.07L22.81 15H17.19L20 11.07zM30 0l-5.5 9h11L30 0zm0 5.07L32.81 9H27.19L30 5.07z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                Athlete Hub
              </h1>
              <p className="text-white/90">
                Connect with fellow athletes and share knowledge
              </p>
            </div>
          </div>

          {/* Live Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">
                {stats?.athlete_count ?? 0}
              </p>
              <p className="text-xs text-white/80">Athletes</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">
                {stats?.discussion_count ?? 0}
              </p>
              <p className="text-xs text-white/80">Discussions</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">
                {stats?.gear_share_count ?? 0}
              </p>
              <p className="text-xs text-white/80">Gear Shares</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={activities}
            onViewGearSetup={handleViewGearSetup}
            loadingGearSetup={loadingGearSetup}
          />
        </div>

        {/* Right Column - Discussions + Gear */}
        <div className="lg:col-span-2 space-y-8">
          <RecentDiscussions discussions={discussions} />
          <TrendingGearSection gear={trendingGear} />
        </div>
      </div>

      {/* Gear Setup Modal */}
      {selectedGearSetup && (
        <GearSetupModal
          setup={selectedGearSetup}
          onClose={() => setSelectedGearSetup(null)}
        />
      )}
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({
  activities,
  onViewGearSetup,
  loadingGearSetup,
}: {
  activities: ActivityItem[];
  onViewGearSetup: (id: string) => void;
  loadingGearSetup: boolean;
}) {
  if (activities.length === 0) {
    return (
      <Card className="border-brand-navy-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-brand-navy-400" />
            <h2 className="font-heading font-semibold text-brand-navy-900">
              Recent Activity
            </h2>
          </div>
          <p className="text-sm text-brand-navy-500 text-center py-8">
            No recent activity yet. Be the first to start a discussion!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-navy-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-brand-navy-400" />
          <h2 className="font-heading font-semibold text-brand-navy-900">
            Recent Activity
          </h2>
        </div>

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex gap-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5",
                    activity.type === "discussion"
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                  )}
                />
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-full bg-brand-navy-100 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <p className="text-sm text-brand-navy-700">
                  <span className="font-medium">{activity.user_name}</span>
                  {activity.type === "discussion" ? (
                    <>
                      {" "}started a discussion in{" "}
                      <Link
                        href={`/dashboard/races/${activity.race_slug}?tab=discussions`}
                        className="text-brand-sky-600 hover:underline font-medium"
                      >
                        {activity.race_name}
                      </Link>
                    </>
                  ) : (
                    <>
                      {" "}shared their gear setup for{" "}
                      <span className="text-brand-navy-900 font-medium">
                        {activity.race_name}
                      </span>
                    </>
                  )}
                </p>
                {activity.title && (
                  <p className="text-sm text-brand-navy-600 mt-0.5 line-clamp-1">
                    &ldquo;{activity.title}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-brand-navy-400">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {activity.type === "gear_share" && activity.id && (
                    <button
                      onClick={() => onViewGearSetup(activity.id!)}
                      disabled={loadingGearSetup}
                      className="text-xs font-medium text-brand-sky-600 hover:text-brand-sky-700 hover:underline disabled:opacity-50"
                    >
                      {loadingGearSetup ? "Loading..." : "View Setup →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Discussions Component
function RecentDiscussions({
  discussions,
}: {
  discussions: DiscussionPreview[];
}) {
  if (discussions.length === 0) {
    return (
      <Card className="border-brand-navy-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-navy-400" />
              <h2 className="font-heading font-semibold text-brand-navy-900">
                Active Discussions
              </h2>
            </div>
          </div>
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
            <p className="text-sm text-brand-navy-500">
              No discussions yet. Add a race to start the conversation!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-navy-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-navy-400" />
            <h2 className="font-heading font-semibold text-brand-navy-900">
              Active Discussions
            </h2>
          </div>
          <Link
            href="/dashboard/races"
            className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium flex items-center gap-1"
          >
            Browse races <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {discussions.map((discussion) => {
            const colors = CATEGORY_COLORS[discussion.category];
            return (
              <Link
                key={discussion.id}
                href={`/dashboard/races/${discussion.race.slug}?tab=discussions`}
                className="block group"
              >
                <div className="p-3 rounded-lg border border-brand-navy-100 hover:border-brand-sky-200 hover:bg-brand-sky-50/50 transition-all">
                  <div className="flex items-start gap-3">
                    {/* User avatar or initial */}
                    {discussion.user.avatar_url ? (
                      <img
                        src={discussion.user.avatar_url}
                        alt={discussion.user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-navy-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-brand-navy-600">
                          {discussion.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            colors.bg,
                            colors.text
                          )}
                        >
                          {CATEGORY_LABELS[discussion.category]}
                        </span>
                        <span className="text-xs text-brand-navy-400">
                          in {discussion.race.name}
                        </span>
                      </div>
                      <h3 className="font-medium text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors line-clamp-1">
                        {discussion.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-brand-navy-500">
                        <span>{discussion.user.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {discussion.reply_count}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(
                            new Date(discussion.last_activity_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-brand-navy-400 mt-4 text-center">
          Add a race to your plans to join discussions
        </p>
      </CardContent>
    </Card>
  );
}

// Trending Gear Component
function TrendingGearSection({ gear }: { gear: TrendingGear | null }) {
  const [expandedBikes, setExpandedBikes] = useState(false);
  const [expandedTires, setExpandedTires] = useState(false);

  if (!gear || gear.total_selections === 0) {
    return (
      <Card className="border-brand-navy-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-navy-400" />
            <h2 className="font-heading font-semibold text-brand-navy-900">
              Trending Gear
            </h2>
          </div>
          <div className="text-center py-8">
            <Bike className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
            <p className="text-sm text-brand-navy-500">
              No gear shared yet. Be the first to share your setup!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    {
      key: "bikes",
      label: "Popular Bikes",
      items: gear.bikes,
      color: "sky",
      expanded: expandedBikes,
      setExpanded: setExpandedBikes,
      expandable: true,
    },
    {
      key: "tires",
      label: "Popular Tires",
      items: gear.tires,
      color: "amber",
      expanded: expandedTires,
      setExpanded: setExpandedTires,
      expandable: true,
    },
    { key: "shoes", label: "Popular Shoes", items: gear.shoes, color: "emerald", expandable: false },
    {
      key: "hydration",
      label: "Hydration Packs",
      items: gear.hydration_packs,
      color: "purple",
      expandable: false,
    },
  ];

  return (
    <Card className="border-brand-navy-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-navy-400" />
            <h2 className="font-heading font-semibold text-brand-navy-900">
              Trending Gear
            </h2>
          </div>
          <span className="text-xs text-brand-navy-400">
            From {gear.total_selections} setups
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map(
            (category) =>
              category.items.length > 0 && (
                <div key={category.key}>
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={cn(
                        "text-sm font-medium",
                        category.color === "sky" && "text-brand-sky-700",
                        category.color === "amber" && "text-amber-700",
                        category.color === "emerald" && "text-emerald-700",
                        category.color === "purple" && "text-purple-700"
                      )}
                    >
                      {category.label}
                    </h3>
                    {category.expandable && category.items.length > 3 && (
                      <button
                        onClick={() => category.setExpanded?.(!category.expanded)}
                        className={cn(
                          "text-xs font-medium hover:underline",
                          category.color === "sky" && "text-brand-sky-600",
                          category.color === "amber" && "text-amber-600"
                        )}
                      >
                        {category.expanded ? "Show Less" : "Show All"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(category.expanded ? category.items : category.items.slice(0, 3)).map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          category.color === "sky" && "bg-brand-sky-50",
                          category.color === "amber" && "bg-amber-50",
                          category.color === "emerald" && "bg-emerald-50",
                          category.color === "purple" && "bg-purple-50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-navy-900 truncate">
                            {item.brand} {item.model}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full ml-2",
                            category.color === "sky" &&
                              "bg-brand-sky-100 text-brand-sky-700",
                            category.color === "amber" &&
                              "bg-amber-100 text-amber-700",
                            category.color === "emerald" &&
                              "bg-emerald-100 text-emerald-700",
                            category.color === "purple" &&
                              "bg-purple-100 text-purple-700"
                          )}
                        >
                          {item.count} riders
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-brand-navy-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard/community/gear"
            className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium flex items-center gap-1"
          >
            Browse All Gear Setups <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="hidden sm:inline text-brand-navy-300">·</span>
          <Link
            href="/dashboard/gear"
            className="text-sm text-brand-navy-500 hover:text-brand-navy-700 font-medium flex items-center gap-1"
          >
            Manage Your Gear
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Gear Setup Modal Component
function GearSetupModal({
  setup,
  onClose,
}: {
  setup: GearSetup;
  onClose: () => void;
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            {setup.user.avatar_url ? (
              <img
                src={setup.user.avatar_url}
                alt={setup.user.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                <span className="text-xl font-bold text-white">
                  {setup.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {setup.user.name}&apos;s Setup
              </h2>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <MapPin className="h-4 w-4" />
                <span>
                  {setup.race.name} {setup.race.year}
                  {setup.race.distance.miles && ` • ${setup.race.distance.miles} mi`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bike */}
          {setup.bike && (
            <div className="rounded-xl bg-brand-sky-50 border border-brand-sky-100 overflow-hidden">
              {setup.bike.image_url && (
                <div className="relative w-full h-48">
                  <img
                    src={setup.bike.image_url}
                    alt={`${setup.bike.brand} ${setup.bike.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start gap-4 p-4">
                <div className="p-2 rounded-lg bg-brand-sky-100">
                  <Bike className="h-6 w-6 text-brand-sky-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-sky-700">Bike</p>
                  <p className="text-lg font-semibold text-brand-navy-900">
                    {setup.bike.brand} {setup.bike.model}
                  </p>
                  {(setup.bike.year || setup.bike.bike_type) && (
                    <p className="text-sm text-brand-navy-500">
                      {setup.bike.year && `${setup.bike.year}`}
                      {setup.bike.year && setup.bike.bike_type && " • "}
                      {setup.bike.bike_type}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tires */}
          {(setup.front_tire || setup.rear_tire) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {setup.front_tire && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <div className="w-6 h-6 rounded-full border-4 border-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">Front Tire</p>
                    <p className="font-semibold text-brand-navy-900">
                      {setup.front_tire.brand} {setup.front_tire.model}
                    </p>
                    {setup.front_tire.width_value && (
                      <p className="text-sm text-brand-navy-500">
                        {setup.front_tire.width_value}
                        {setup.front_tire.width_unit || "mm"}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {setup.rear_tire && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <div className="w-6 h-6 rounded-full border-4 border-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">Rear Tire</p>
                    <p className="font-semibold text-brand-navy-900">
                      {setup.rear_tire.brand} {setup.rear_tire.model}
                    </p>
                    {setup.rear_tire.width_value && (
                      <p className="text-sm text-brand-navy-500">
                        {setup.rear_tire.width_value}
                        {setup.rear_tire.width_unit || "mm"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Gear Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {setup.shoe && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Footprints className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">Shoes</p>
                  <p className="font-semibold text-brand-navy-900">
                    {setup.shoe.brand} {setup.shoe.model}
                  </p>
                </div>
              </div>
            )}

            {setup.hydration_pack && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Droplets className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Hydration</p>
                  <p className="font-semibold text-brand-navy-900">
                    {setup.hydration_pack.brand} {setup.hydration_pack.model}
                  </p>
                  {setup.hydration_pack.capacity_liters && (
                    <p className="text-sm text-brand-navy-500">
                      {setup.hydration_pack.capacity_liters}L capacity
                    </p>
                  )}
                </div>
              </div>
            )}

            {setup.repair_kit && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Wrench className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Repair Kit</p>
                  <p className="font-semibold text-brand-navy-900">
                    {setup.repair_kit.name}
                  </p>
                  {setup.repair_kit.items && setup.repair_kit.items.length > 0 && (
                    <p className="text-sm text-brand-navy-500">
                      {setup.repair_kit.items.length} items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bags */}
          {setup.bags && setup.bags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-brand-navy-600 mb-2">Bags</h3>
              <div className="flex flex-wrap gap-2">
                {setup.bags.map((bag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-navy-100 text-sm text-brand-navy-700"
                  >
                    {bag.brand} {bag.model}
                    {bag.bag_type && ` (${bag.bag_type})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {setup.notes && (
            <div className="p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
              <p className="text-sm font-medium text-brand-navy-600 mb-1">Notes</p>
              <p className="text-sm text-brand-navy-700">{setup.notes}</p>
            </div>
          )}

          {/* Empty state if no gear */}
          {!setup.bike && !setup.front_tire && !setup.rear_tire && !setup.shoe && !setup.hydration_pack && (
            <div className="text-center py-8">
              <Bike className="h-12 w-12 text-brand-navy-300 mx-auto mb-3" />
              <p className="text-brand-navy-500">No gear details shared yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-brand-navy-50 border-t border-brand-navy-100 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-navy-500">
              Shared {formatDistanceToNow(new Date(setup.created_at), { addSuffix: true })}
            </p>
            <Link
              href={`/dashboard/races/${setup.race.slug}`}
              className="text-sm font-medium text-brand-sky-600 hover:text-brand-sky-700 flex items-center gap-1"
              onClick={onClose}
            >
              View Race <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
