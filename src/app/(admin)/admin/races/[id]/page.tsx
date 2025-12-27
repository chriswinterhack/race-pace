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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  RichTextDisplay,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { RaceLogisticsEditor } from "@/components/admin/RaceLogisticsEditor";
import { EditionCard, AddEditionModal, EditRaceModal } from "@/components/admin/races";
import type { Race, RaceEdition, RaceDistance } from "@/types/admin";

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
            <RichTextDisplay content={race.description} />
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
