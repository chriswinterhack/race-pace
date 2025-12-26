"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  FileUp,
  Mountain,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Flag,
  X,
  GripVertical,
  Bike,
  Footprints,
  Droplet,
  Milestone,
  ImagePlus,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
} from "@/components/ui";
import { cn, formatDateRange, formatDateShort } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useGpxUpload, useHeroImageUpload } from "@/hooks";
import { toast } from "sonner";
import { RaceLogisticsEditor } from "@/components/admin/RaceLogisticsEditor";
import Image from "next/image";

interface AidStation {
  id?: string; // For drag and drop tracking
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint"; // Defaults to "aid_station" for backward compatibility
}

interface SurfaceComposition {
  gravel?: number;
  pavement?: number;
  singletrack?: number;
  doubletrack?: number;
  dirt?: number;
}

type DistanceRaceType = "road" | "gravel" | "xc_mtb" | "ultra_mtb";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  start_time: string | null;
  gpx_file_url: string | null;
  elevation_gain: number | null;
  is_active: boolean;
  sort_order: number;
  aid_stations: AidStation[] | null;
  surface_composition: SurfaceComposition | null;
  race_type: DistanceRaceType | null;
}

interface RaceEdition {
  id: string;
  year: number;
  date: string | null;
  is_active: boolean;
  race_distances: RaceDistance[];
}

interface RaceLogistics {
  parking_info?: string;
  packet_pickup?: { date: string; start_time: string; end_time: string; location: string; notes?: string }[];
  event_schedule?: { time: string; title: string; description?: string }[];
  crew_info?: string;
  crew_locations?: { name: string; mile_out: number; mile_in?: number; access_type: "unlimited" | "limited" | "reserved"; parking_info?: string; setup_time?: string; shuttle_info?: string; notes?: string; restrictions?: string }[];
  drop_bag_info?: string;
  course_rules?: string;
  course_marking?: string;
  weather_notes?: string;
  additional_info?: string;
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  race_type: "bike" | "run";
  race_subtype: string;
  race_editions: RaceEdition[];
  // Logistics fields
  parking_info: string | null;
  packet_pickup: RaceLogistics["packet_pickup"] | null;
  event_schedule: RaceLogistics["event_schedule"] | null;
  crew_info: string | null;
  crew_locations: RaceLogistics["crew_locations"] | null;
  drop_bag_info: string | null;
  course_rules: string | null;
  course_marking: string | null;
  weather_notes: string | null;
  additional_info: string | null;
}

export default function RaceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEdition, setShowAddEdition] = useState(false);
  const [showLogisticsEditor, setShowLogisticsEditor] = useState(false);
  const [showEditRace, setShowEditRace] = useState(false);
  const [expandedEditions, setExpandedEditions] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchRace();
  }, [id]);

  async function fetchRace() {
    setLoading(true);
    const { data, error } = await supabase
      .from("races")
      .select(`
        id,
        name,
        slug,
        location,
        description,
        website_url,
        hero_image_url,
        is_active,
        race_type,
        race_subtype,
        parking_info,
        packet_pickup,
        event_schedule,
        crew_info,
        crew_locations,
        drop_bag_info,
        course_rules,
        course_marking,
        weather_notes,
        additional_info,
        race_editions (
          id,
          year,
          date,
          is_active,
          race_distances (
            id,
            name,
            distance_miles,
            date,
            start_time,
            gpx_file_url,
            elevation_gain,
            is_active,
            sort_order,
            aid_stations,
            surface_composition,
            race_type
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching race:", error);
      toast.error("Failed to load race");
    } else if (data) {
      // Sort editions by year desc, distances by sort_order
      const sortedRace = {
        ...data,
        race_editions: (data.race_editions || [])
          .sort((a: RaceEdition, b: RaceEdition) => b.year - a.year)
          .map((edition: RaceEdition) => ({
            ...edition,
            race_distances: (edition.race_distances || []).sort(
              (a: RaceDistance, b: RaceDistance) => a.sort_order - b.sort_order
            ),
          })),
      };
      setRace(sortedRace);
      // Expand first edition by default
      const firstEdition = sortedRace.race_editions[0];
      if (firstEdition) {
        setExpandedEditions(new Set([firstEdition.id]));
      }
    }
    setLoading(false);
  }

  const toggleEdition = (editionId: string) => {
    setExpandedEditions((prev) => {
      const next = new Set(prev);
      if (next.has(editionId)) {
        next.delete(editionId);
      } else {
        next.add(editionId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-navy-600">Race not found</p>
        <Link href="/admin/races" className="text-brand-sky-500 hover:underline mt-2 inline-block">
          Back to races
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/races"
        className="inline-flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Races
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
              {race.name}
            </h1>
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                race.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-brand-navy-100 text-brand-navy-600"
              )}
            >
              {race.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-brand-navy-600">
            {race.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {race.location}
              </span>
            )}
            {race.website_url && (
              <a
                href={race.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-sky-500 hover:text-brand-sky-600"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowLogisticsEditor(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Race Day Logistics
          </Button>
          <Button variant="outline" onClick={() => setShowEditRace(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Race
          </Button>
        </div>
      </div>

      {/* Race Info Card */}
      {race.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-navy-700">{race.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Editions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-brand-navy-900">
            Race Editions
          </h2>
          <Button onClick={() => setShowAddEdition(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Edition
          </Button>
        </div>

        <div className="space-y-4">
          {race.race_editions.map((edition) => (
            <EditionCard
              key={edition.id}
              edition={edition}
              raceSlug={race.slug}
              expanded={expandedEditions.has(edition.id)}
              onToggle={() => toggleEdition(edition.id)}
              onRefresh={fetchRace}
            />
          ))}
        </div>

        {race.race_editions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-brand-navy-300 mb-4" />
              <h3 className="text-lg font-medium text-brand-navy-900">
                No editions yet
              </h3>
              <p className="mt-1 text-brand-navy-600">
                Add a race edition to start managing dates and distances
              </p>
              <Button className="mt-4" onClick={() => setShowAddEdition(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Edition
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Edition Modal */}
      {showAddEdition && race && (
        <AddEditionModal
          raceId={race.id}
          raceName={race.name}
          onClose={() => setShowAddEdition(false)}
          onCreated={() => {
            setShowAddEdition(false);
            fetchRace();
          }}
        />
      )}

      {/* Race Logistics Editor Modal */}
      {showLogisticsEditor && race && (
        <RaceLogisticsEditor
          raceId={race.id}
          raceName={race.name}
          initialData={{
            parking_info: race.parking_info || undefined,
            packet_pickup: race.packet_pickup || undefined,
            event_schedule: race.event_schedule || undefined,
            crew_info: race.crew_info || undefined,
            crew_locations: race.crew_locations || undefined,
            drop_bag_info: race.drop_bag_info || undefined,
            course_rules: race.course_rules || undefined,
            course_marking: race.course_marking || undefined,
            weather_notes: race.weather_notes || undefined,
            additional_info: race.additional_info || undefined,
          }}
          onClose={() => setShowLogisticsEditor(false)}
          onSaved={() => {
            setShowLogisticsEditor(false);
            fetchRace();
          }}
        />
      )}

      {/* Edit Race Modal */}
      {showEditRace && race && (
        <EditRaceModal
          race={race}
          onClose={() => setShowEditRace(false)}
          onSaved={() => {
            setShowEditRace(false);
            fetchRace();
          }}
        />
      )}
    </div>
  );
}

interface EditionCardProps {
  edition: RaceEdition;
  raceSlug: string;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

function EditionCard({ edition, raceSlug, expanded, onToggle, onRefresh }: EditionCardProps) {
  const [showAddDistance, setShowAddDistance] = useState(false);
  const [showEditEdition, setShowEditEdition] = useState(false);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Edition Header */}
        <div className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-brand-navy-50/50 transition-colors">
          <button
            onClick={onToggle}
            className="flex items-center gap-3 text-left flex-1"
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-brand-navy-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-brand-navy-400" />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-brand-navy-900">
                  {edition.year} Edition
                </h3>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    edition.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-brand-navy-100 text-brand-navy-600"
                  )}
                >
                  {edition.is_active ? "Active" : "Past"}
                </span>
              </div>
              <p className="text-sm text-brand-navy-600 mt-1">
                {edition.race_distances.length} distance{edition.race_distances.length !== 1 ? "s" : ""}
                {(() => {
                  const distanceDates = edition.race_distances.map(d => d.date);
                  const dateRange = formatDateRange(distanceDates);
                  return dateRange ? <span className="ml-2">· {dateRange}</span> : null;
                })()}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditEdition(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Distances List */}
        {expanded && (
          <div className="border-t border-brand-navy-100">
            {edition.race_distances.map((distance) => (
              <DistanceRow
                key={distance.id}
                distance={distance}
                raceSlug={raceSlug}
                editionYear={edition.year}
                onRefresh={onRefresh}
              />
            ))}

            {/* Add Distance Button */}
            <div className="p-4 bg-brand-navy-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDistance(true)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Distance
              </Button>
            </div>
          </div>
        )}

        {/* Add Distance Modal */}
        {showAddDistance && (
          <AddDistanceModal
            editionId={edition.id}
            editionYear={edition.year}
            raceSlug={raceSlug}
            onClose={() => setShowAddDistance(false)}
            onCreated={() => {
              setShowAddDistance(false);
              onRefresh();
            }}
          />
        )}

        {/* Edit Edition Modal */}
        {showEditEdition && (
          <EditEditionModal
            edition={edition}
            onClose={() => setShowEditEdition(false)}
            onSaved={() => {
              setShowEditEdition(false);
              onRefresh();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface DistanceRowProps {
  distance: RaceDistance;
  raceSlug: string;
  editionYear: number;
  onRefresh: () => void;
}

function DistanceRow({ distance, raceSlug, editionYear, onRefresh }: DistanceRowProps) {
  const [showAidStations, setShowAidStations] = useState(false);
  const [showEditDistance, setShowEditDistance] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { upload, isUploading, progress } = useGpxUpload();

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Pass distanceId so API can update database directly with service role
    const result = await upload(file, raceSlug, editionYear, distance.id);
    if (result) {
      toast.success("GPX uploaded successfully!");
      onRefresh();
    } else {
      toast.error("Failed to upload GPX");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${distance.name || distance.distance_miles + " mi"} distance? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/distances?id=${distance.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to delete distance");
      } else {
        toast.success("Distance deleted");
        onRefresh();
      }
    } catch (error) {
      toast.error("Failed to delete distance");
    }
    setDeleting(false);
  };

  const displayName = distance.name
    ? `${distance.name} (${distance.distance_miles} mi)`
    : `${distance.distance_miles} mi`;

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-brand-navy-100 last:border-b-0 flex items-center justify-between hover:bg-brand-navy-50/30">
      <div className="flex items-center gap-4">
        <div className="w-24 sm:w-32">
          <span className="font-semibold text-brand-navy-900">{displayName}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-brand-navy-600">
          {distance.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateShort(distance.date)}
            </span>
          )}
          {distance.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {distance.start_time.slice(0, 5)}
            </span>
          )}
          {distance.elevation_gain && (
            <span className="flex items-center gap-1">
              <Mountain className="h-3.5 w-3.5" />
              {distance.elevation_gain.toLocaleString()} ft
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Aid Stations Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAidStations(true)}
          className={cn(
            distance.aid_stations && distance.aid_stations.length > 0
              ? "text-emerald-600 border-emerald-200 hover:border-emerald-300"
              : ""
          )}
        >
          <Flag className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">
            {distance.aid_stations?.length || 0}
          </span>
        </Button>

        {/* GPX Upload/Replace */}
        <div className="flex items-center gap-1">
          {distance.gpx_file_url && (
            <a
              href={distance.gpx_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mr-1"
              title="Download GPX"
            >
              <CheckCircle className="h-4 w-4" />
            </a>
          )}
          <div className="relative">
            <input
              type="file"
              accept=".gpx"
              onChange={handleGpxUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button variant="outline" size="sm" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-1">{progress}%</span>
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">
                    {distance.gpx_file_url ? "Replace" : "GPX"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setShowEditDistance(true)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Aid Stations Modal */}
      {showAidStations && (
        <AidStationsModal
          distanceId={distance.id}
          distanceName={displayName}
          aidStations={distance.aid_stations || []}
          onClose={() => setShowAidStations(false)}
          onSaved={() => {
            setShowAidStations(false);
            onRefresh();
          }}
        />
      )}

      {/* Edit Distance Modal */}
      {showEditDistance && (
        <EditDistanceModal
          distance={distance}
          onClose={() => setShowEditDistance(false)}
          onSaved={() => {
            setShowEditDistance(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function AddEditionModal({
  raceId,
  raceName,
  onClose,
  onCreated,
}: {
  raceId: string;
  raceName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear + 1);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("race_editions").insert({
      race_id: raceId,
      year,
      is_active: true,
    });

    if (error) {
      toast.error(error.message || "Failed to create edition");
      setSaving(false);
    } else {
      toast.success("Edition created!");
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Add Edition
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Create a new edition for {raceName}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>
            <p className="text-xs text-brand-navy-500">
              After creating the edition, add distances with their specific race dates.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Edition
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditEditionModal({
  edition,
  onClose,
  onSaved,
}: {
  edition: RaceEdition;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [year, setYear] = useState(edition.year);
  const [isActive, setIsActive] = useState(edition.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/editions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: edition.id,
          year,
          isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update edition");
        setSaving(false);
        return;
      }

      toast.success("Edition updated!");
      onSaved();
    } catch (error) {
      toast.error("Failed to update edition");
      setSaving(false);
    }
  };

  // Compute date range from distances
  const distanceDates = edition.race_distances
    .map(d => d.date)
    .filter((d): d is string => d !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Edition
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update the {edition.year} edition details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year *</Label>
              <Input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>

            {distanceDates.length > 0 && (
              <div className="p-3 bg-brand-navy-50 rounded-lg">
                <p className="text-sm text-brand-navy-600">
                  <span className="font-medium">Race dates:</span> Set on each distance option
                </p>
                <p className="text-xs text-brand-navy-500 mt-1">
                  Edit individual distances to change their dates
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-brand-navy-300 text-brand-sky-600 focus:ring-brand-sky-500"
              />
              <Label htmlFor="edit-is-active" className="text-sm font-normal">
                Active edition (visible to athletes)
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const RACE_TYPE_OPTIONS: { value: DistanceRaceType; label: string; description: string }[] = [
  { value: "road", label: "Road", description: "Road race with drafting" },
  { value: "gravel", label: "Gravel", description: "Gravel with some drafting" },
  { value: "xc_mtb", label: "XC MTB", description: "Cross-country MTB" },
  { value: "ultra_mtb", label: "Ultra MTB", description: "Ultra MTB with hike-a-bike" },
];

function EditDistanceModal({
  distance,
  onClose,
  onSaved,
}: {
  distance: RaceDistance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    name: distance.name || "",
    distance_miles: distance.distance_miles.toString(),
    date: distance.date || "",
    start_time: distance.start_time || "",
    elevation_gain: distance.elevation_gain?.toString() || "",
    race_type: (distance.race_type || "gravel") as DistanceRaceType,
  });
  const [surface, setSurface] = useState<SurfaceComposition>(
    distance.surface_composition || {}
  );
  const [saving, setSaving] = useState(false);

  // Calculate total percentage
  const totalPercent = Object.values(surface).reduce((sum, val) => sum + (val || 0), 0);

  const handleSurfaceChange = (key: keyof SurfaceComposition, value: string) => {
    const numValue = parseInt(value) || 0;
    setSurface({ ...surface, [key]: numValue > 0 ? numValue : undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Clean surface composition (remove zero/undefined values)
    const cleanedSurface: SurfaceComposition = {};
    Object.entries(surface).forEach(([key, val]) => {
      if (val && val > 0) {
        cleanedSurface[key as keyof SurfaceComposition] = val;
      }
    });

    try {
      const response = await fetch("/api/admin/distances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceId: distance.id,
          name: formData.name || null,
          distance_miles: parseFloat(formData.distance_miles),
          date: formData.date || null,
          start_time: formData.start_time || null,
          elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : null,
          surface_composition: Object.keys(cleanedSurface).length > 0 ? cleanedSurface : null,
          race_type: formData.race_type,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update distance");
        setSaving(false);
        return;
      }

      toast.success("Distance updated!");
      onSaved();
    } catch (error) {
      toast.error("Failed to update distance");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Distance
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update distance details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-dist-miles">Distance (miles) *</Label>
                <Input
                  id="edit-dist-miles"
                  type="number"
                  step="0.1"
                  value={formData.distance_miles}
                  onChange={(e) => setFormData({ ...formData, distance_miles: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dist-name">Name (optional)</Label>
                <Input
                  id="edit-dist-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., XL, Black, Sprint"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-dist-date">Race Date</Label>
                <Input
                  id="edit-dist-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dist-time">Start Time</Label>
                <Input
                  id="edit-dist-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dist-elevation">Elevation Gain (ft)</Label>
              <Input
                id="edit-dist-elevation"
                type="number"
                value={formData.elevation_gain}
                onChange={(e) => setFormData({ ...formData, elevation_gain: e.target.value })}
                placeholder="4500"
              />
            </div>

            {/* Race Type for Power Calculation */}
            <div className="space-y-2">
              <Label>Race Type (Power Adjustment)</Label>
              <p className="text-xs text-brand-navy-500">
                Affects real-world power adjustment for goal time calculations
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {RACE_TYPE_OPTIONS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, race_type: value })}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-colors",
                      formData.race_type === value
                        ? "border-brand-sky-500 bg-brand-sky-50"
                        : "border-brand-navy-200 hover:border-brand-navy-300"
                    )}
                  >
                    <div className="font-medium text-sm text-brand-navy-900">{label}</div>
                    <div className="text-xs text-brand-navy-500 mt-0.5">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Surface Composition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Surface Composition</Label>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded",
                  totalPercent === 100 ? "bg-emerald-100 text-emerald-700" :
                  totalPercent === 0 ? "bg-brand-navy-100 text-brand-navy-500" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {totalPercent}% total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "gravel", label: "Gravel" },
                  { key: "pavement", label: "Pavement" },
                  { key: "singletrack", label: "Singletrack" },
                  { key: "doubletrack", label: "Doubletrack" },
                  { key: "dirt", label: "Dirt Road" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={surface[key as keyof SurfaceComposition] || ""}
                      onChange={(e) => handleSurfaceChange(key as keyof SurfaceComposition, e.target.value)}
                      className="w-20 h-9"
                      placeholder="0"
                    />
                    <span className="text-sm text-brand-navy-600">% {label}</span>
                  </div>
                ))}
              </div>
              {totalPercent > 0 && totalPercent !== 100 && (
                <p className="text-xs text-amber-600">
                  Surface percentages should add up to 100%
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditRaceModal({
  race,
  onClose,
  onSaved,
}: {
  race: Race;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    name: race.name,
    slug: race.slug,
    location: race.location || "",
    description: race.description || "",
    website_url: race.website_url || "",
    is_active: race.is_active,
    race_type: race.race_type as "bike" | "run",
    race_subtype: race.race_subtype || "",
  });
  const [saving, setSaving] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(race.hero_image_url || null);
  const { upload: uploadHeroImage, isUploading: isUploadingHero, progress: heroProgress } = useHeroImageUpload();

  const handleHeroImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setHeroImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload the file (API updates database directly)
    const result = await uploadHeroImage(file, race.id, race.slug);
    if (result) {
      setHeroImagePreview(result.url);
      toast.success("Hero image uploaded!");
    } else {
      toast.error("Failed to upload hero image");
      setHeroImagePreview(race.hero_image_url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/races", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceId: race.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update race");
        setSaving(false);
        return;
      }

      toast.success("Race updated!");
      onSaved();
    } catch (error) {
      toast.error("Failed to update race");
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Race
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update race details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-race-name">Race Name *</Label>
              <Input
                id="edit-race-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-race-slug">URL Slug *</Label>
              <Input
                id="edit-race-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <p className="text-xs text-brand-navy-500">
                Used in URLs: /races/{formData.slug || "slug"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-race-location">Location</Label>
              <Input
                id="edit-race-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Stillwater, OK"
              />
            </div>

            {/* Race Type Selection */}
            <div className="space-y-2">
              <Label>Race Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "bike", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                    formData.race_type === "bike"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Bike className="h-5 w-5" />
                  <span className="font-medium">Cycling</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "run", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                    formData.race_type === "run"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Footprints className="h-5 w-5" />
                  <span className="font-medium">Running</span>
                </button>
              </div>
            </div>

            {/* Race Subtype Selection */}
            {formData.race_type && (
              <div className="space-y-2">
                <Label>{formData.race_type === "bike" ? "Discipline" : "Race Type"} *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.race_type === "bike" ? (
                    <>
                      {["gravel", "mtb", "road"].map((subtype) => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setFormData({ ...formData, race_subtype: subtype })}
                          className={cn(
                            "p-3 rounded-lg border-2 text-sm font-medium transition-colors capitalize",
                            formData.race_subtype === subtype
                              ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                              : "border-brand-navy-200 hover:border-brand-navy-300"
                          )}
                        >
                          {subtype === "mtb" ? "MTB" : subtype}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {["trail", "ultra", "road"].map((subtype) => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setFormData({ ...formData, race_subtype: subtype })}
                          className={cn(
                            "p-3 rounded-lg border-2 text-sm font-medium transition-colors capitalize",
                            formData.race_subtype === subtype
                              ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                              : "border-brand-navy-200 hover:border-brand-navy-300"
                          )}
                        >
                          {subtype}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-race-website">Website URL</Label>
              <Input
                id="edit-race-website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-race-description">Description</Label>
              <textarea
                id="edit-race-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="flex w-full rounded-md border border-brand-navy-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-brand-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400 focus-visible:ring-offset-2"
              />
            </div>

            {/* Hero Image Upload */}
            <div className="space-y-2">
              <Label>Hero Image</Label>
              <p className="text-xs text-brand-navy-500">
                Landscape image (16:9 ratio) for race cards. Recommended: 1200x675px
              </p>
              <div className="mt-2">
                {heroImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-brand-navy-200">
                    <div className="aspect-video relative">
                      <Image
                        src={heroImagePreview}
                        alt="Hero image preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-white text-sm font-medium drop-shadow-lg">
                        {race.name}
                      </span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleHeroImageSelect}
                          className="hidden"
                          disabled={isUploadingHero}
                        />
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          isUploadingHero
                            ? "bg-white/50 text-brand-navy-600"
                            : "bg-white/90 text-brand-navy-700 hover:bg-white"
                        )}>
                          {isUploadingHero ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {heroProgress}%
                            </>
                          ) : (
                            <>
                              <ImagePlus className="h-3.5 w-3.5" />
                              Replace
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleHeroImageSelect}
                      className="hidden"
                      disabled={isUploadingHero}
                    />
                    <div className={cn(
                      "aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                      isUploadingHero
                        ? "border-brand-sky-300 bg-brand-sky-50"
                        : "border-brand-navy-200 hover:border-brand-sky-400 hover:bg-brand-sky-50/50"
                    )}>
                      {isUploadingHero ? (
                        <>
                          <Loader2 className="h-8 w-8 text-brand-sky-500 animate-spin" />
                          <span className="text-sm text-brand-sky-600">Uploading... {heroProgress}%</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-brand-navy-400" />
                          <span className="text-sm text-brand-navy-600">Click to upload hero image</span>
                          <span className="text-xs text-brand-navy-400">JPG, PNG, or WebP up to 5MB</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-race-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-brand-navy-300 text-brand-sky-600 focus:ring-brand-sky-500"
              />
              <Label htmlFor="edit-race-active" className="text-sm font-normal">
                Active (visible to athletes)
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.race_type || !formData.race_subtype}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddDistanceModal({
  editionId,
  editionYear,
  raceSlug,
  onClose,
  onCreated,
}: {
  editionId: string;
  editionYear: number;
  raceSlug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    distance_miles: "",
    date: "",
    start_time: "",
    elevation_gain: "",
  });
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { upload, isUploading, progress } = useGpxUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let gpxUrl = null;
    if (gpxFile) {
      const result = await upload(gpxFile, raceSlug, editionYear);
      if (result) {
        gpxUrl = result.url;
      } else {
        toast.error("Failed to upload GPX");
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/distances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          race_edition_id: editionId,
          name: formData.name || null,
          distance_miles: parseFloat(formData.distance_miles),
          date: formData.date || null,
          start_time: formData.start_time || null,
          elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : null,
          gpx_file_url: gpxUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to create distance");
        setSaving(false);
        return;
      }

      toast.success("Distance added!");
      onCreated();
    } catch (error) {
      toast.error("Failed to create distance");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Add Distance
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Add a new distance option for {editionYear}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (miles) *</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance_miles}
                  onChange={(e) => setFormData({ ...formData, distance_miles: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., XL, Black, Sprint"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevation">Elevation Gain (ft)</Label>
              <Input
                id="elevation"
                type="number"
                value={formData.elevation_gain}
                onChange={(e) => setFormData({ ...formData, elevation_gain: e.target.value })}
                placeholder="4500"
              />
            </div>

            <div className="space-y-2">
              <Label>GPX File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  gpxFile ? "border-emerald-300 bg-emerald-50" : "border-brand-navy-200 hover:border-brand-sky-400"
                )}
              >
                <input
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="gpx-upload-modal"
                />
                <label htmlFor="gpx-upload-modal" className="cursor-pointer">
                  {gpxFile ? (
                    <span className="text-sm text-emerald-700">{gpxFile.name}</span>
                  ) : (
                    <span className="text-sm text-brand-navy-500">Click to select GPX</span>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || isUploading}>
                {(saving || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploading ? `Uploading ${progress}%` : "Add Distance"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sortable Aid Station Item Component
function SortableAidStationItem({
  station,
  index,
  onUpdate,
  onRemove,
}: {
  station: AidStation & { id: string };
  index: number;
  onUpdate: (updates: Partial<AidStation>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: station.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Default to aid_station for backward compatibility
  const stationType = station.type || "aid_station";
  const isAidStation = stationType === "aid_station";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 rounded-lg border",
        isAidStation
          ? "bg-emerald-50 border-emerald-200"
          : "bg-brand-navy-50 border-brand-navy-200",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1.5 text-brand-navy-400 hover:text-brand-navy-600 cursor-grab active:cursor-grabbing rounded hover:bg-brand-navy-100 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
          isAidStation
            ? "bg-emerald-200 text-emerald-700"
            : "bg-brand-sky-100 text-brand-sky-700"
        )}>
          {index + 1}
        </div>
        <div className="flex-1 space-y-3">
          {/* Type Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ type: "aid_station" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                isAidStation
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-brand-navy-200 text-brand-navy-600 hover:border-brand-navy-300"
              )}
            >
              <Droplet className="h-3.5 w-3.5" />
              Aid Station
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ type: "checkpoint" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                !isAidStation
                  ? "bg-brand-sky-600 text-white"
                  : "bg-white border border-brand-navy-200 text-brand-navy-600 hover:border-brand-navy-300"
              )}
            >
              <Milestone className="h-3.5 w-3.5" />
              Checkpoint
            </button>
          </div>
          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={station.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder={isAidStation ? "e.g., Pipeline Aid Station" : "e.g., Start of Climb 1"}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mile Marker *</Label>
              <Input
                type="number"
                step="0.1"
                value={station.mile || ""}
                onChange={(e) =>
                  onUpdate({ mile: parseFloat(e.target.value) || 0 })
                }
                placeholder="24.5"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cutoff Time</Label>
              <Input
                type="time"
                value={station.cutoff_time || ""}
                onChange={(e) => onUpdate({ cutoff_time: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AidStationsModal({
  distanceId,
  distanceName,
  aidStations: initialStations,
  onClose,
  onSaved,
}: {
  distanceId: string;
  distanceName: string;
  aidStations: AidStation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Add unique IDs to stations for drag and drop
  const [stations, setStations] = useState<(AidStation & { id: string })[]>(
    initialStations.map((s, i) => ({ ...s, id: s.id || `station-${i}-${Date.now()}` }))
  );
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStation = (type: "aid_station" | "checkpoint" = "aid_station") => {
    setStations([
      ...stations,
      { id: `station-new-${Date.now()}`, name: "", mile: 0, cutoff_time: "", type },
    ]);
  };

  const updateStation = (id: string, updates: Partial<AidStation>) => {
    setStations(
      stations.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeStation = (id: string) => {
    setStations(stations.filter((s) => s.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStations((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Clean stations for saving (remove empty ones, strip internal IDs)
    const cleanedStations = stations
      .filter((s) => s.name && s.mile >= 0)
      .map(({ name, mile, supplies, cutoff_time, type }) => ({
        name,
        mile,
        supplies: supplies || [],
        cutoff_time: cutoff_time || null,
        type: type || "aid_station", // Default to aid_station for backward compatibility
      }));

    try {
      const response = await fetch("/api/admin/aid-stations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceId,
          aidStations: cleanedStations,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to save aid stations");
        setSaving(false);
        return;
      }

      toast.success("Aid stations saved!");
      onSaved();
    } catch (error) {
      toast.error("Failed to save aid stations");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
                Aid Stations / Checkpoints
              </h2>
              <p className="mt-1 text-sm text-brand-navy-600">
                Manage checkpoints for {distanceName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-navy-400 hover:text-brand-navy-600 hover:bg-brand-navy-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-xs text-brand-navy-500 flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            Drag to reorder checkpoints
          </p>

          <div className="mt-4 space-y-4">
            {stations.length === 0 ? (
              <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
                <Flag className="h-10 w-10 mx-auto text-brand-navy-300 mb-3" />
                <p className="text-brand-navy-600">No aid stations or checkpoints added yet</p>
                <p className="text-sm text-brand-navy-500 mt-1">
                  Add aid stations (resupply points) and checkpoints (climb starts, landmarks) to help athletes plan their race
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stations.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {stations.map((station, index) => (
                      <SortableAidStationItem
                        key={station.id}
                        station={station}
                        index={index}
                        onUpdate={(updates) => updateStation(station.id, updates)}
                        onRemove={() => removeStation(station.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => addStation("aid_station")}
                className="flex-1 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
              >
                <Droplet className="h-4 w-4 mr-2" />
                Add Aid Station
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addStation("checkpoint")}
                className="flex-1 border-dashed"
              >
                <Milestone className="h-4 w-4 mr-2" />
                Add Checkpoint
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-brand-navy-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
