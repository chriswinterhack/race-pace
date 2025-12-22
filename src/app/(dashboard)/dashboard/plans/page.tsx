"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Route,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { cn, formatDateWithYear } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDuration } from "@/lib/calculations";

interface RacePlan {
  id: string;
  goal_time_minutes: number;
  status: string;
  created_at: string;
  race: {
    id: string;
    name: string;
    location: string | null;
  };
  race_distance: {
    id: string;
    name: string | null;
    distance_miles: number;
    date: string | null;
  } | null;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<RacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("race_plans")
      .select(`
        id,
        goal_time_minutes,
        status,
        created_at,
        race:races (
          id,
          name,
          location
        ),
        race_distance:race_distances (
          id,
          name,
          distance_miles,
          date
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } else {
      setPlans((data as unknown as RacePlan[]) || []);
    }
    setLoading(false);
  }

  async function deletePlan(planId: string) {
    setDeleting(planId);
    const { error } = await supabase
      .from("race_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      toast.error("Failed to delete plan");
    } else {
      toast.success("Plan deleted");
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
            My Plans
          </h1>
          <p className="mt-1 text-brand-navy-600">
            Your race execution plans
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Link>
        </Button>
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

      {/* Plans List */}
      {!loading && plans.length > 0 && (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-elevated transition-shadow">
              <CardContent className="p-0">
                <Link href={`/dashboard/plans/${plan.id}`} className="block p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-brand-navy-900 truncate">
                          {plan.race.name}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            plan.status === "complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {plan.status === "complete" ? "Complete" : "Draft"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600">
                        {plan.race.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {plan.race.location}
                          </span>
                        )}
                        {plan.race_distance && (
                          <span className="flex items-center gap-1">
                            <Route className="h-3.5 w-3.5" />
                            {plan.race_distance.name
                              ? `${plan.race_distance.name} (${plan.race_distance.distance_miles} mi)`
                              : `${plan.race_distance.distance_miles} mi`}
                          </span>
                        )}
                        {plan.race_distance?.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateWithYear(plan.race_distance.date)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Goal: {formatDuration(plan.goal_time_minutes)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this plan?")) {
                          deletePlan(plan.id);
                        }
                      }}
                      className="p-2 text-brand-navy-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={deleting === plan.id}
                    >
                      {deleting === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-brand-navy-100 mb-4">
            <ClipboardList className="h-8 w-8 text-brand-navy-400" />
          </div>
          <h2 className="text-lg font-medium text-brand-navy-900">
            No plans yet
          </h2>
          <p className="mt-1 text-brand-navy-600 max-w-sm">
            Create your first race plan to get personalized pacing,
            nutrition, and checkpoint strategies.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
