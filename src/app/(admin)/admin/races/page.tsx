"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  MapPin,
  Edit,
  ChevronRight,
  Loader2,
  Bike,
  Footprints,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface RaceEdition {
  id: string;
  year: number;
  date: string | null;
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  is_active: boolean;
  description: string | null;
  website_url: string | null;
  race_type: "bike" | "run";
  race_subtype: string;
  race_editions: RaceEdition[];
}

export default function AdminRacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchRaces();
  }, []);

  async function fetchRaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("races")
      .select(`
        id,
        name,
        slug,
        location,
        is_active,
        description,
        website_url,
        race_type,
        race_subtype,
        race_editions (
          id,
          year,
          date
        )
      `)
      .order("name");

    if (error) {
      console.error("Error fetching races:", error);
      toast.error("Failed to load races");
    } else {
      // Sort editions by year descending
      const racesWithSortedEditions = (data || []).map((race) => ({
        ...race,
        race_editions: (race.race_editions || []).sort(
          (a: RaceEdition, b: RaceEdition) => b.year - a.year
        ),
      }));
      setRaces(racesWithSortedEditions);
    }
    setLoading(false);
  }

  const filteredRaces = races.filter(
    (race) =>
      race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (race.location?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
            Race Management
          </h1>
          <p className="mt-1 text-brand-navy-600">
            Create and manage races and their editions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Race
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
        <Input
          placeholder="Search races..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Races List */}
      {!loading && (
        <div className="grid gap-4">
          {filteredRaces.map((race) => (
            <Card
              key={race.id}
              className="hover:shadow-elevated transition-shadow"
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between p-4 sm:p-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-brand-navy-900 truncate">
                        {race.name}
                      </h3>
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
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600">
                      <span className="flex items-center gap-1">
                        {race.race_type === "bike" ? (
                          <Bike className="h-3.5 w-3.5" />
                        ) : (
                          <Footprints className="h-3.5 w-3.5" />
                        )}
                        <span className="capitalize">{race.race_subtype}</span>
                      </span>
                      {race.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {race.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/races/${race.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brand-navy-500"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Editions */}
                <div className="border-t border-brand-navy-100 bg-brand-navy-50/50 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-brand-navy-400" />
                      <span className="font-medium text-brand-navy-700">
                        {race.race_editions.length} Edition
                        {race.race_editions.length !== 1 ? "s" : ""}
                      </span>
                      {race.race_editions.length > 0 && (
                        <span className="text-brand-navy-500">
                          · Latest: {race.race_editions[0]?.year}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/admin/races/${race.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-brand-sky-500 hover:text-brand-sky-600"
                    >
                      Manage Editions
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredRaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-navy-600">
            {searchQuery
              ? "No races found matching your search."
              : "No races yet. Add your first race!"}
          </p>
        </div>
      )}

      {/* Create Race Modal */}
      {showCreateModal && (
        <CreateRaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchRaces();
          }}
        />
      )}
    </div>
  );
}

function CreateRaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    location: "",
    description: "",
    website_url: "",
    race_type: "" as "" | "bike" | "run",
    race_subtype: "",
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("races").insert({
      name: formData.name,
      slug: formData.slug,
      location: formData.location || null,
      description: formData.description || null,
      website_url: formData.website_url || null,
      race_type: formData.race_type,
      race_subtype: formData.race_subtype,
      is_active: true,
    });

    if (error) {
      console.error("Error creating race:", error);
      toast.error(error.message || "Failed to create race");
      setSaving(false);
    } else {
      toast.success("Race created successfully!");
      onCreated();
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
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Create New Race
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Add a new race to the platform
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-brand-navy-700"
              >
                Race Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                placeholder="e.g., Mid South Gravel"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-brand-navy-700"
              >
                URL Slug *
              </label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="mid-south-gravel"
                required
              />
              <p className="text-xs text-brand-navy-500">
                Used in URLs: /races/{formData.slug || "slug"}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="location"
                className="text-sm font-medium text-brand-navy-700"
              >
                Location *
              </label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Stillwater, OK"
                required
              />
            </div>

            {/* Race Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-navy-700">
                Race Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "bike", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors",
                    formData.race_type === "bike"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Bike className="h-5 w-5" />
                  <span className="font-medium">Bike</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "run", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors",
                    formData.race_type === "run"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Footprints className="h-5 w-5" />
                  <span className="font-medium">Run</span>
                </button>
              </div>
            </div>

            {/* Race Subtype Selection */}
            {formData.race_type && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy-700">
                  {formData.race_type === "bike" ? "Discipline" : "Race Type"} *
                </label>
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
              <label
                htmlFor="website"
                className="text-sm font-medium text-brand-navy-700"
              >
                Website URL
              </label>
              <Input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-brand-navy-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the race..."
                rows={3}
                className="flex w-full rounded-md border border-brand-navy-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-brand-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400 focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.race_type || !formData.race_subtype}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Race
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
