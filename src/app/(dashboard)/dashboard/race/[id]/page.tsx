"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Loader2,
  Trash2,
  Route,
  MessageSquare,
  LayoutDashboard,
  Download,
} from "lucide-react";
import {
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
import { ParticipantGearSection } from "./sections/ParticipantGearSection";
import { ChecklistSection } from "./sections/ChecklistSection";
import { ExportSection } from "./sections/ExportSection";
import { DiscussionsSection } from "@/components/discussions";

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
        hero_image_url: string | null;
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

type SectionId = "overview" | "course" | "goal" | "pacing" | "power" | "nutrition" | "gear" | "checklist" | "community" | "export";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  category: "plan" | "strategy" | "prep" | "social";
}

const sections: Section[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, category: "plan" },
  { id: "course", label: "Course", icon: Route, category: "plan" },
  { id: "goal", label: "Goal", icon: Target, category: "strategy" },
  { id: "pacing", label: "Splits", icon: Clock, category: "strategy" },
  { id: "power", label: "Power", icon: Zap, category: "strategy" },
  { id: "nutrition", label: "Nutrition", icon: Utensils, category: "strategy" },
  { id: "gear", label: "Gear", icon: Bike, category: "prep" },
  { id: "checklist", label: "Checklist", icon: CheckSquare, category: "prep" },
  { id: "community", label: "Discuss", icon: MessageSquare, category: "social" },
  { id: "export", label: "Export", icon: Download, category: "prep" },
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
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const supabase = createClient();

  useEffect(() => {
    fetchPlan();
  }, [id]);

  // Update indicator position when active section changes
  useEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      if (!nav) return;

      const activeButton = nav.querySelector(`[data-section="${activeSection}"]`) as HTMLButtonElement;
      if (activeButton) {
        const navRect = nav.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - navRect.left + nav.scrollLeft,
          width: buttonRect.width,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeSection, plan]);

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
          climbing_pct,
          flat_pct,
          descent_pct,
          avg_climb_grade,
          avg_descent_grade,
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
              hero_image_url,
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

    try {
      // First, get the nutrition plan ID if it exists
      const { data: nutritionPlan } = await supabase
        .from("race_nutrition_plans")
        .select("id")
        .eq("race_plan_id", id)
        .single();

      if (nutritionPlan) {
        // Delete nutrition plan items first (there could be thousands)
        const { error: itemsError } = await supabase
          .from("race_nutrition_plan_items")
          .delete()
          .eq("nutrition_plan_id", nutritionPlan.id);

        if (itemsError) {
          console.error("Error deleting nutrition items:", itemsError);
        }

        // Delete nutrition plan water entries
        const { error: waterError } = await supabase
          .from("race_nutrition_plan_water")
          .delete()
          .eq("nutrition_plan_id", nutritionPlan.id);

        if (waterError) {
          console.error("Error deleting water entries:", waterError);
        }

        // Delete the nutrition plan itself
        const { error: planError } = await supabase
          .from("race_nutrition_plans")
          .delete()
          .eq("id", nutritionPlan.id);

        if (planError) {
          console.error("Error deleting nutrition plan:", planError);
        }
      }

      // Now delete the race plan
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
    } catch (err) {
      console.error("Error during deletion:", err);
      toast.error("Failed to delete race plan");
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
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
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
        const [year, month, day] = distance.date.split("-").map(Number);
        const raceDate = new Date(year!, month! - 1, day!);
        return Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      })()
    : null;

  // Generate gradient for races without hero image
  const generateGradient = (name: string): string => {
    const gradients = [
      "from-brand-navy-900 via-brand-navy-800 to-brand-sky-900",
      "from-emerald-900 via-teal-800 to-brand-navy-900",
      "from-amber-900 via-orange-800 to-red-900",
      "from-purple-900 via-violet-800 to-brand-navy-900",
      "from-rose-900 via-pink-800 to-purple-900",
      "from-brand-sky-900 via-cyan-800 to-teal-900",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length]!;
  };

  const gradient = race ? generateGradient(race.name) : "from-brand-navy-900 via-brand-navy-800 to-brand-sky-900";

  return (
    <div className="-mt-6 lg:-mt-8">
      {/* Hero Header - Full viewport width */}
      <div className="relative ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen">
        <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
          {race?.hero_image_url ? (
            <Image
              src={race.hero_image_url}
              alt={race.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
              {/* Geometric pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>
          )}

          {/* Multiple gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

          {/* Top bar with back button and actions - contained */}
          <div className="absolute top-0 left-0 right-0">
            <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-4 flex items-center justify-between">
              {/* Back button - Refined */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-all duration-200 border border-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Link>

              {/* Actions - Right side */}
              <div className="flex items-center gap-2">
            {/* Days countdown badge */}
            {daysUntil !== null && daysUntil > 0 && (
              <div className={cn(
                "px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md border",
                daysUntil <= 7
                  ? "bg-red-500/80 border-red-400/50 text-white"
                  : daysUntil <= 30
                    ? "bg-amber-500/80 border-amber-400/50 text-white"
                    : "bg-white/10 border-white/20 text-white"
              )}>
                {daysUntil === 1 ? "Tomorrow!" : `${daysUntil} days`}
              </div>
            )}

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Content - Contained at bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container mx-auto max-w-7xl px-4 lg:px-6 pb-6 sm:pb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight">
                {race?.name}
              </h1>
              <p className="mt-2 text-lg sm:text-xl text-white/80 font-medium">{displayName}</p>

              {/* Quick Stats Pills */}
              <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
                {race?.location && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                    <MapPin className="h-4 w-4 text-white/70" />
                    {race.location}
                  </span>
                )}
                {distance?.date && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                    <Calendar className="h-4 w-4 text-white/70" />
                    {(() => {
                      const [year, month, day] = distance.date.split("-").map(Number);
                      const date = new Date(year!, month! - 1, day!);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    })()}
                  </span>
                )}
                {distance?.elevation_gain && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                    <Mountain className="h-4 w-4 text-white/70" />
                    {distance.elevation_gain.toLocaleString()} ft
                  </span>
                )}
                {plan.goal_time_minutes && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sky-500/90 backdrop-blur-md text-white text-sm font-semibold border border-brand-sky-400/50">
                    <Target className="h-4 w-4" />
                    {formatDuration(plan.goal_time_minutes)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Section Navigation - Full viewport width */}
      <div className="sticky top-16 z-20 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen bg-white/80 backdrop-blur-xl border-b border-brand-navy-100">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          <div
            ref={navRef}
            className="relative flex gap-1 overflow-x-auto scrollbar-hide py-3"
          >
          {/* Animated indicator */}
          <div
            className="absolute top-1 h-[calc(100%-8px)] bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 rounded-xl transition-all duration-300 ease-out shadow-lg"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              // Add subtle separator between categories
              const prevSection = sections[index - 1];
              const showSeparator = prevSection && prevSection.category !== section.category;

              return (
                <div key={section.id} className="flex items-center">
                  {showSeparator && (
                    <div className="w-px h-6 bg-brand-navy-200 mx-1" />
                  )}
                  <button
                    data-section={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                      isActive
                        ? "text-white"
                        : "text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-colors", isActive && "text-brand-sky-300")} />
                    <span>{section.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-navy-100 overflow-hidden">
          <div className="p-6 sm:p-8">
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
              <ParticipantGearSection plan={plan as any} />
            )}
            {activeSection === "checklist" && (
              <ChecklistSection plan={plan as any} />
            )}
            {activeSection === "community" && race && (
              <DiscussionsSection raceId={race.id} raceName={race.name} />
            )}
            {activeSection === "export" && (
              <ExportSection plan={plan as any} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Race Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-brand-navy-600 py-4">
            Are you sure you want to delete your plan for <span className="font-semibold text-brand-navy-900">{race?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
