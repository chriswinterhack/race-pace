"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Mountain, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
} from "@/components/ui";
import { cn, formatDistance, formatElevation, formatDateWithYear } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUnits } from "@/hooks";
import { toast } from "sonner";

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  date: string | null;
  elevation_gain: number | null;
}

interface RaceEdition {
  id: string;
  year: number;
  race_distances: RaceDistance[];
}

interface Race {
  id: string;
  name: string;
}

interface AddToMyRacesModalProps {
  open: boolean;
  onClose: () => void;
  race: Race;
  edition: RaceEdition;
}

export function AddToMyRacesModal({
  open,
  onClose,
  race,
  edition,
}: AddToMyRacesModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const { units } = useUnits();

  const [selectedDistanceId, setSelectedDistanceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!selectedDistanceId) {
      toast.error("Please select a distance");
      return;
    }

    setSaving(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to add a race");
      setSaving(false);
      return;
    }

    // Check if user already has this race distance
    const { data: existing } = await supabase
      .from("race_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("race_distance_id", selectedDistanceId)
      .single();

    if (existing) {
      toast.error("You've already added this race distance");
      setSaving(false);
      return;
    }

    // Create the race plan
    const { error } = await supabase.from("race_plans").insert({
      user_id: user.id,
      race_id: race.id,
      race_edition_id: edition.id,
      race_distance_id: selectedDistanceId,
      status: "draft",
    });

    if (error) {
      console.error("Error adding race:", error);
      toast.error("Failed to add race");
      setSaving(false);
      return;
    }

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-medium">Race added!</span>
        <span className="text-sm text-gray-600">{race.name} is now in your races</span>
      </div>,
      {
        action: {
          label: "Go to Dashboard",
          onClick: () => router.push("/dashboard"),
        },
      }
    );

    setSaving(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to My Races</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-brand-navy-600">
            Select a distance for <span className="font-medium text-brand-navy-900">{race.name}</span>
          </p>

          <div className="space-y-2">
            <Label>Distance</Label>
            <div className="space-y-2">
              {edition.race_distances.map((distance) => {
                const isSelected = selectedDistanceId === distance.id;
                const displayName = distance.name
                  ? `${distance.name} (${formatDistance(distance.distance_miles, units)})`
                  : formatDistance(distance.distance_miles, units);

                return (
                  <button
                    key={distance.id}
                    type="button"
                    onClick={() => setSelectedDistanceId(distance.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? "border-brand-sky-500 bg-brand-sky-50"
                        : "border-brand-navy-200 hover:border-brand-navy-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(
                          "font-semibold",
                          isSelected ? "text-brand-sky-700" : "text-brand-navy-900"
                        )}>
                          {displayName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-brand-navy-600">
                          {distance.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateWithYear(distance.date)}
                            </span>
                          )}
                          {distance.elevation_gain && (
                            <span className="flex items-center gap-1">
                              <Mountain className="h-3 w-3" />
                              {formatElevation(distance.elevation_gain, units)}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded-full bg-brand-sky-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={saving || !selectedDistanceId}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Race"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
