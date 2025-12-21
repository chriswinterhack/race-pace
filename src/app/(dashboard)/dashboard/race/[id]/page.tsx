"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Mountain,
  Clock,
  Target,
  Zap,
  Utensils,
  Bike,
  CheckSquare,
  FileText,
  Loader2,
  Trash2,
  Info,
  Route,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/calculations";
import { toast } from "sonner";

// Section components
import { OverviewSection } from "./sections/OverviewSection";
import { CourseSection } from "./sections/CourseSection";
import { GoalSection } from "./sections/GoalSection";
import { PacingSection } from "./sections/PacingSection";
import { PowerSection } from "./sections/PowerSection";
import { NutritionSection } from "./sections/NutritionSection";
import { GearSection } from "./sections/GearSection";
import { ChecklistSection } from "./sections/ChecklistSection";
import { ParticipantsSection } from "./sections/ParticipantsSection";
import { ExportSection } from "./sections/ExportSection";

interface RacePlan {
  id: string;
  user_id: string;
  goal_time_minutes: number | null;
  start_time: string | null;
  status: string;
  created_at: string;
  race_distance: {
    id: string;
    name: string | null;
    distance_miles: number;
    gpx_distance_miles: number | null;
    distance_km: number | null;
    date: string | null;
    start_time: string | null;
    wave_info: string | null;
    elevation_gain: number | null;
    elevation_loss: number | null;
    elevation_high: number | null;
    elevation_low: number | null;
    gpx_file_url: string | null;
    surface_composition: Record<string, number> | null;
    aid_stations: Array<{ name: string; mile: number; cutoff?: string }> | null;
    time_limit_minutes: number | null;
    participant_limit: number | null;
    registration_url: string | null;
    race_edition: {
      id: string;
      year: number;
      race: {
        id: string;
        name: string;
        slug: string;
        location: string | null;
        description: string | null;
        parking_info: string | null;
        packet_pickup: { date: string; start_time: string; end_time: string; location: string; notes?: string }[] | null;
        event_schedule: { time: string; title: string; description?: string }[] | null;
        crew_info: string | null;
        crew_locations: { name: string; mile_out: number; mile_in?: number; access_type: "unlimited" | "limited" | "reserved"; parking_info?: string; setup_time?: string; shuttle_info?: string; notes?: string; restrictions?: string }[] | null;
        drop_bag_info: string | null;
        course_rules: string | null;
        course_marking: string | null;
        weather_notes: string | null;
        additional_info: string | null;
      };
    };
  };
  segments: Array<{
    id: string;
    segment_order: number;
    start_mile: number;
    end_mile: number;
    start_name: string | null;
    end_name: string | null;
    target_time_minutes: number;
    effort_level: string;
    power_target_low: number | null;
    power_target_high: number | null;
    elevation_gain: number | null;
    elevation_loss: number | null;
    avg_gradient: number | null;
  }>;
}

type SectionId = "overview" | "course" | "goal" | "pacing" | "power" | "nutrition" | "gear" | "checklist" | "participants" | "export";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const sections: Section[] = [
  { id: "overview", label: "Overview", icon: Info, description: "Race details and information" },
  { id: "course", label: "Course", icon: Route, description: "Elevation profile and map" },
  { id: "goal", label: "Goal Time", icon: Target, description: "Set your target finish time" },
  { id: "pacing", label: "Pacing", icon: Clock, description: "Plan segment times and checkpoint arrivals" },
  { id: "power", label: "Power", icon: Zap, description: "Set power targets by terrain" },
  { id: "nutrition", label: "Nutrition", icon: Utensils, description: "Plan your fueling strategy" },
  { id: "gear", label: "Gear", icon: Bike, description: "Select equipment for race day" },
  { id: "checklist", label: "Checklist", icon: CheckSquare, description: "Pack list and race day prep" },
  { id: "participants", label: "Participants", icon: Users, description: "See other athletes' gear choices" },
  { id: "export", label: "Export", icon: FileText, description: "Top tube stickers and PDF plan" },
];

export default function RaceDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [plan, setPlan] = useState<RacePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchPlan();
  }, [id]);

  async function fetchPlan() {
    setLoading(true);
    const { data, error } = await supabase
      .from("race_plans")
      .select(`
        id,
        user_id,
        goal_time_minutes,
        start_time,
        status,
        created_at,
        race_distance:race_distances (
          id,
          name,
          distance_miles,
          gpx_distance_miles,
          distance_km,
          date,
          start_time,
          wave_info,
          elevation_gain,
          elevation_loss,
          elevation_high,
          elevation_low,
          gpx_file_url,
          surface_composition,
          aid_stations,
          time_limit_minutes,
          participant_limit,
          registration_url,
          race_edition:race_editions (
            id,
            year,
            race:races (
              id,
              name,
              slug,
              location,
              description,
              parking_info,
              packet_pickup,
              event_schedule,
              crew_info,
              crew_locations,
              drop_bag_info,
              course_rules,
              course_marking,
              weather_notes,
              additional_info
            )
          )
        ),
        segments (
          id,
          segment_order,
          start_mile,
          end_mile,
          start_name,
          end_name,
          target_time_minutes,
          effort_level,
          power_target_low,
          power_target_high,
          elevation_gain,
          elevation_loss,
          avg_gradient
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching plan:", error);
      toast.error("Failed to load race plan");
      router.push("/dashboard");
    } else {
      setPlan(data as unknown as RacePlan);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase
      .from("race_plans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete race plan");
    } else {
      toast.success("Race plan deleted");
      router.push("/dashboard");
    }
    setDeleting(false);
  }

  async function updatePlan(updates: Partial<RacePlan>) {
    const { error } = await supabase
      .from("race_plans")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to save changes");
      return false;
    }

    toast.success("Changes saved");
    fetchPlan();
    return true;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-navy-600">Race plan not found</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const distance = plan.race_distance;
  const race = distance?.race_edition?.race;
  const displayName = distance?.name
    ? `${distance.name} (${distance.distance_miles} mi)`
    : `${distance?.distance_miles} mi`;

  const daysUntil = distance?.date
    ? (() => {
        // Parse as local time to avoid timezone issues
        const [year, month, day] = distance.date.split("-").map(Number);
        const raceDate = new Date(year!, month! - 1, day!);
        return Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-brand-navy-600 hover:text-brand-navy-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Races
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
              {race?.name}
            </h1>
            <p className="mt-1 text-lg text-brand-navy-600">{displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            {daysUntil !== null && daysUntil > 0 && (
              <span className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                daysUntil <= 7 ? "bg-red-100 text-red-700" :
                daysUntil <= 30 ? "bg-amber-100 text-amber-700" :
                "bg-brand-sky-100 text-brand-sky-700"
              )}>
                {daysUntil} days to go
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Race info bar */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-navy-600">
          {race?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {race.location}
            </span>
          )}
          {distance?.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {(() => {
                // Parse as local time to avoid timezone issues
                const [year, month, day] = distance.date.split("-").map(Number);
                const date = new Date(year!, month! - 1, day!);
                return date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
              })()}
            </span>
          )}
          {distance?.elevation_gain && (
            <span className="flex items-center gap-1">
              <Mountain className="h-4 w-4" />
              {distance.elevation_gain.toLocaleString()} ft elevation
            </span>
          )}
          {plan.goal_time_minutes && (
            <span className="flex items-center gap-1 font-medium text-brand-navy-900">
              <Clock className="h-4 w-4" />
              Goal: {formatDuration(plan.goal_time_minutes)}
            </span>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-brand-sky-100 text-brand-sky-700"
                  : "text-brand-navy-600 hover:bg-brand-navy-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <Card>
        <CardContent className="p-6">
          {activeSection === "overview" && (
            <OverviewSection plan={plan as any} onUpdate={fetchPlan} />
          )}
          {activeSection === "course" && (
            <CourseSection plan={plan as any} />
          )}
          {activeSection === "goal" && (
            <GoalSection plan={plan as any} onUpdate={updatePlan as any} />
          )}
          {activeSection === "pacing" && (
            <PacingSection plan={plan as any} onUpdate={fetchPlan} />
          )}
          {activeSection === "power" && (
            <PowerSection plan={plan as any} />
          )}
          {activeSection === "nutrition" && (
            <NutritionSection plan={plan as any} />
          )}
          {activeSection === "gear" && (
            <GearSection plan={plan as any} />
          )}
          {activeSection === "checklist" && (
            <ChecklistSection plan={plan as any} />
          )}
          {activeSection === "participants" && (
            <ParticipantsSection plan={plan as any} />
          )}
          {activeSection === "export" && (
            <ExportSection plan={plan as any} />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Race Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-brand-navy-600">
            Are you sure you want to delete your plan for {race?.name}? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
