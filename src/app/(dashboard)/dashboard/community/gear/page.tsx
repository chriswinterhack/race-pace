"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Bike,
  Circle,
  Footprints,
  Wrench,
  Droplets,
  Loader2,
  ArrowLeft,
  X,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Types
interface GearSetupSummary {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  race: {
    id: string;
    name: string;
    slug: string;
    type: string;
    year: number;
    distance: {
      name: string | null;
      miles: number;
    };
  };
  gear: {
    bike: { brand: string; model: string; year?: number } | null;
    frontTire: { brand: string; model: string; width?: string } | null;
    rearTire: { brand: string; model: string; width?: string } | null;
    shoes: { brand: string; model: string } | null;
    repairKit: { name: string; itemCount: number } | null;
    hydrationPack: { brand: string; model: string } | null;
  };
}

interface GearFilters {
  search: string;
  raceType: string;
  distanceRange: string;
  sortBy: string;
}

interface GearSetup {
  id: string;
  notes: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  race: {
    id: string;
    name: string;
    slug: string;
    location: string;
    year: number;
    distance: {
      name: string | null;
      miles: number;
    };
  };
  bike: { brand: string; model: string; year?: number; bike_type?: string; image_url?: string } | null;
  front_tire: { brand: string; model: string; width_value?: number; width_unit?: string; tire_type?: string } | null;
  rear_tire: { brand: string; model: string; width_value?: number; width_unit?: string; tire_type?: string } | null;
  shoe: { brand: string; model: string; shoe_type?: string } | null;
  hydration_pack: { brand: string; model: string; capacity_liters?: number } | null;
  repair_kit: { name: string; items: string[] } | null;
  bags: { brand: string; model: string; bag_type?: string; capacity_liters?: number }[];
}

const defaultFilters: GearFilters = {
  search: "",
  raceType: "all",
  distanceRange: "any",
  sortBy: "newest",
};

const raceTypes = [
  { value: "all", label: "All" },
  { value: "gravel", label: "Gravel" },
  { value: "mtb", label: "MTB" },
  { value: "road", label: "Road" },
  { value: "cx", label: "CX" },
];

const distanceRanges = [
  { value: "any", label: "Any Distance", min: null, max: null },
  { value: "under50", label: "Under 50mi", min: 0, max: 50 },
  { value: "50to100", label: "50-100mi", min: 50, max: 100 },
  { value: "100to150", label: "100-150mi", min: 100, max: 150 },
  { value: "over150", label: "150mi+", min: 150, max: null },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

// Race type badge colors
const raceTypeBadgeColors: Record<string, string> = {
  gravel: "bg-amber-100 text-amber-800",
  mtb: "bg-emerald-100 text-emerald-800",
  road: "bg-blue-100 text-blue-800",
  cx: "bg-purple-100 text-purple-800",
};

// Loading fallback component
function GearDiscoveryLoading() {
  return (
    <div className="min-h-screen bg-brand-navy-50">
      <div className="bg-gradient-to-br from-brand-navy-900 via-brand-sky-900 to-brand-navy-800 text-white">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="h-6 w-32 bg-white/20 rounded mb-4 animate-pulse" />
          <div className="h-10 w-64 bg-white/20 rounded mb-2 animate-pulse" />
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
        </div>
      </div>
    </div>
  );
}

// Main page wrapper with Suspense
export default function GearDiscoveryPage() {
  return (
    <Suspense fallback={<GearDiscoveryLoading />}>
      <GearDiscoveryContent />
    </Suspense>
  );
}

function GearDiscoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const [filters, setFilters] = useState<GearFilters>(() => ({
    search: searchParams.get("search") || "",
    raceType: searchParams.get("type") || "all",
    distanceRange: searchParams.get("distance") || "any",
    sortBy: searchParams.get("sort") || "newest",
  }));

  const [selections, setSelections] = useState<GearSetupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [meta, setMeta] = useState({ totalSetups: 0, totalAthletes: 0, totalRaces: 0 });

  // Modal state
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [selectedSetup, setSelectedSetup] = useState<GearSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);

  // Fetch gear setups
  const fetchSetups = useCallback(async (newOffset: number = 0, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.raceType !== "all") params.set("raceType", filters.raceType);
      if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);

      // Map distance range to min/max
      const range = distanceRanges.find((r) => r.value === filters.distanceRange);
      if (range && range.min !== null) params.set("distanceMin", String(range.min));
      if (range && range.max !== null) params.set("distanceMax", String(range.max));

      params.set("limit", "20");
      params.set("offset", String(newOffset));

      const response = await fetch(`/api/community/gear/discover?${params}`);
      const result = await response.json();

      if (result.data) {
        if (append) {
          setSelections((prev) => [...prev, ...result.data.selections]);
        } else {
          setSelections(result.data.selections);
        }
        setHasMore(result.data.pagination.hasMore);
        setMeta(result.data.meta);
        setOffset(newOffset + result.data.selections.length);
      }
    } catch (error) {
      console.error("Error fetching gear setups:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // Fetch on filter change
  useEffect(() => {
    fetchSetups(0, false);
  }, [fetchSetups]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.raceType !== "all") params.set("type", filters.raceType);
    if (filters.distanceRange !== "any") params.set("distance", filters.distanceRange);
    if (filters.sortBy !== "newest") params.set("sort", filters.sortBy);

    const newUrl = params.toString() ? `?${params}` : "";
    router.replace(`/dashboard/community/gear${newUrl}`, { scroll: false });
  }, [filters, router]);

  // Fetch full setup when modal opens
  useEffect(() => {
    if (selectedSetupId) {
      setLoadingSetup(true);
      fetch(`/api/community/gear/${selectedSetupId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.data) {
            setSelectedSetup(result.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSetup(false));
    } else {
      setSelectedSetup(null);
    }
  }, [selectedSetupId]);

  // Handle escape key for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSetupId(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSetups(offset, true);
    }
  };

  const updateFilter = (key: keyof GearFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-brand-navy-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-navy-900 via-brand-sky-900 to-brand-navy-800 text-white">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Back link */}
          <Link
            href="/dashboard/community"
            className="inline-flex items-center gap-2 text-brand-sky-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Athlete Hub
          </Link>

          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Discover Gear Setups
          </h1>
          <p className="text-brand-sky-200 text-lg">
            {meta.totalSetups} setups shared by {meta.totalAthletes} athletes across {meta.totalRaces} races
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-white border-b border-brand-navy-200 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          {/* Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
              <input
                type="text"
                placeholder="Search by race or athlete..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-navy-200 focus:border-brand-sky-500 focus:ring-2 focus:ring-brand-sky-500/20 outline-none transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter("search", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Race Type Filter */}
            <div className="flex items-center gap-1 bg-brand-navy-100 rounded-lg p-1">
              {raceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateFilter("raceType", type.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    filters.raceType === type.value
                      ? "bg-white text-brand-navy-900 shadow-sm"
                      : "text-brand-navy-600 hover:text-brand-navy-900"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Distance Filter */}
            <div className="relative">
              <select
                value={filters.distanceRange}
                onChange={(e) => updateFilter("distanceRange", e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-brand-navy-200 bg-white text-sm font-medium text-brand-navy-700 focus:border-brand-sky-500 focus:ring-2 focus:ring-brand-sky-500/20 outline-none transition-all cursor-pointer"
              >
                {distanceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-brand-navy-200 bg-white text-sm font-medium text-brand-navy-700 focus:border-brand-sky-500 focus:ring-2 focus:ring-brand-sky-500/20 outline-none transition-all cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="animate-pulse">
                    <div className="p-4 border-b border-brand-navy-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-navy-200" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-brand-navy-200 rounded mb-2" />
                          <div className="h-3 w-32 bg-brand-navy-100 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-full bg-brand-navy-100 rounded" />
                      <div className="h-4 w-3/4 bg-brand-navy-100 rounded" />
                      <div className="h-4 w-1/2 bg-brand-navy-100 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selections.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-brand-navy-100 flex items-center justify-center mx-auto mb-4">
              <Bike className="h-8 w-8 text-brand-navy-400" />
            </div>
            <h3 className="text-xl font-semibold text-brand-navy-900 mb-2">
              No gear setups found
            </h3>
            <p className="text-brand-navy-600 max-w-md mx-auto">
              {filters.search || filters.raceType !== "all" || filters.distanceRange !== "any"
                ? "Try adjusting your filters to see more results."
                : "Be the first to share your gear setup and help other athletes!"}
            </p>
            {(filters.search || filters.raceType !== "all" || filters.distanceRange !== "any") && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-4 px-4 py-2 text-sm font-medium text-brand-sky-600 hover:text-brand-sky-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selections.map((setup) => (
                <GearSetupCard
                  key={setup.id}
                  setup={setup}
                  onViewSetup={() => setSelectedSetupId(setup.id)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-brand-navy-900 text-white rounded-lg font-medium hover:bg-brand-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Setups"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selectedSetupId && (
        <GearSetupModal
          setup={selectedSetup}
          loading={loadingSetup}
          onClose={() => setSelectedSetupId(null)}
        />
      )}
    </div>
  );
}

// Gear Setup Card Component
function GearSetupCard({
  setup,
  onViewSetup,
}: {
  setup: GearSetupSummary;
  onViewSetup: () => void;
}) {
  const { user, race, gear, createdAt } = setup;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={onViewSetup}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-brand-navy-100 bg-gradient-to-r from-brand-navy-50 to-white">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-navy-900 truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-brand-navy-600">
                <span className="truncate">{race.name} {race.year}</span>
                <span>·</span>
                <span className="flex-shrink-0">{Math.round(race.distance.miles)}mi</span>
              </div>
            </div>
            {/* Race type badge */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 capitalize",
                raceTypeBadgeColors[race.type] || "bg-gray-100 text-gray-800"
              )}
            >
              {race.type}
            </span>
          </div>
        </div>

        {/* Gear Summary */}
        <div className="p-4 space-y-2">
          {gear.bike && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-sky-100 flex items-center justify-center flex-shrink-0">
                <Bike className="h-3.5 w-3.5 text-brand-sky-600" />
              </div>
              <span className="text-sm text-brand-navy-700 truncate">
                {gear.bike.brand} {gear.bike.model}
                {gear.bike.year && <span className="text-brand-navy-400 ml-1">({gear.bike.year})</span>}
              </span>
            </div>
          )}

          {(gear.frontTire || gear.rearTire) && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Circle className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-sm text-brand-navy-700 truncate">
                {gear.frontTire
                  ? `${gear.frontTire.brand} ${gear.frontTire.model}${gear.frontTire.width ? ` (${gear.frontTire.width})` : ""}`
                  : gear.rearTire
                  ? `${gear.rearTire.brand} ${gear.rearTire.model}`
                  : ""}
              </span>
            </div>
          )}

          {gear.shoes && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Footprints className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-sm text-brand-navy-700 truncate">
                {gear.shoes.brand} {gear.shoes.model}
              </span>
            </div>
          )}

          {gear.hydrationPack && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Droplets className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm text-brand-navy-700 truncate">
                {gear.hydrationPack.brand} {gear.hydrationPack.model}
              </span>
            </div>
          )}

          {gear.repairKit && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <span className="text-sm text-brand-navy-700 truncate">
                {gear.repairKit.name}
                <span className="text-brand-navy-400 ml-1">({gear.repairKit.itemCount} items)</span>
              </span>
            </div>
          )}

          {!gear.bike && !gear.frontTire && !gear.rearTire && !gear.shoes && !gear.repairKit && !gear.hydrationPack && (
            <p className="text-sm text-brand-navy-400 italic">No gear details shared</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-brand-navy-100 flex items-center justify-between bg-brand-navy-50/50">
          <span className="text-xs text-brand-navy-500">
            Shared {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <span className="text-sm font-medium text-brand-sky-600 group-hover:text-brand-sky-700 transition-colors">
            View Setup →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Gear Setup Modal Component
function GearSetupModal({
  setup,
  loading,
  onClose,
}: {
  setup: GearSetup | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !setup ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="p-6 border-b border-brand-navy-100 bg-gradient-to-r from-brand-navy-900 to-brand-sky-900 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ring-4 ring-white/20">
                    {setup.user.avatar_url ? (
                      <img
                        src={setup.user.avatar_url}
                        alt={setup.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      setup.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{setup.user.name}&apos;s Setup</h2>
                    <p className="text-brand-sky-200">
                      {setup.race.name} {setup.race.year} · {Math.round(setup.race.distance.miles)}mi
                    </p>
                    {setup.race.location && (
                      <p className="text-brand-sky-300 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {setup.race.location}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
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
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-sky-100 flex items-center justify-center">
                        <Bike className="h-5 w-5 text-brand-sky-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-navy-900">
                          {setup.bike.brand} {setup.bike.model}
                        </p>
                        <p className="text-sm text-brand-navy-600">
                          {setup.bike.year && `${setup.bike.year} · `}
                          {setup.bike.bike_type && <span className="capitalize">{setup.bike.bike_type}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tires */}
              {(setup.front_tire || setup.rear_tire) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Circle className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="font-semibold text-brand-navy-900">Tires</p>
                  </div>
                  <div className="space-y-2 ml-13">
                    {setup.front_tire && (
                      <p className="text-sm text-brand-navy-700">
                        <span className="font-medium">Front:</span> {setup.front_tire.brand} {setup.front_tire.model}
                        {setup.front_tire.width_value && ` (${setup.front_tire.width_value}${setup.front_tire.width_unit || "mm"})`}
                      </p>
                    )}
                    {setup.rear_tire && (
                      <p className="text-sm text-brand-navy-700">
                        <span className="font-medium">Rear:</span> {setup.rear_tire.brand} {setup.rear_tire.model}
                        {setup.rear_tire.width_value && ` (${setup.rear_tire.width_value}${setup.rear_tire.width_unit || "mm"})`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Shoes */}
              {setup.shoe && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Footprints className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy-900">
                        {setup.shoe.brand} {setup.shoe.model}
                      </p>
                      {setup.shoe.shoe_type && (
                        <p className="text-sm text-brand-navy-600 capitalize">{setup.shoe.shoe_type}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hydration Pack */}
              {setup.hydration_pack && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy-900">
                        {setup.hydration_pack.brand} {setup.hydration_pack.model}
                      </p>
                      {setup.hydration_pack.capacity_liters && (
                        <p className="text-sm text-brand-navy-600">{setup.hydration_pack.capacity_liters}L capacity</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Repair Kit */}
              {setup.repair_kit && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="font-semibold text-brand-navy-900">{setup.repair_kit.name}</p>
                  </div>
                  {setup.repair_kit.items && setup.repair_kit.items.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-13">
                      {setup.repair_kit.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bags */}
              {setup.bags && setup.bags.length > 0 && (
                <div className="p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-100">
                  <p className="font-semibold text-brand-navy-900 mb-3">Bags</p>
                  <div className="flex flex-wrap gap-2">
                    {setup.bags.map((bag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-sm bg-white border border-brand-navy-200 rounded-lg"
                      >
                        {bag.brand} {bag.model}
                        {bag.bag_type && <span className="text-brand-navy-400 ml-1 capitalize">({bag.bag_type})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {setup.notes && (
                <div className="p-4 rounded-xl bg-brand-navy-100 border border-brand-navy-200">
                  <p className="font-semibold text-brand-navy-900 mb-2">Notes</p>
                  <p className="text-sm text-brand-navy-700 whitespace-pre-wrap">{setup.notes}</p>
                </div>
              )}

              {/* Empty state */}
              {!setup.bike && !setup.front_tire && !setup.rear_tire && !setup.shoe && !setup.hydration_pack && !setup.repair_kit && (!setup.bags || setup.bags.length === 0) && (
                <div className="text-center py-8 text-brand-navy-500">
                  No gear details have been shared yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-brand-navy-100 bg-brand-navy-50 flex items-center justify-between">
              <span className="text-sm text-brand-navy-500">
                Shared {formatDistanceToNow(new Date(setup.created_at), { addSuffix: true })}
              </span>
              <Link
                href={`/dashboard/races/${setup.race.slug}`}
                className="text-sm font-medium text-brand-sky-600 hover:text-brand-sky-700 transition-colors"
              >
                View Race →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
