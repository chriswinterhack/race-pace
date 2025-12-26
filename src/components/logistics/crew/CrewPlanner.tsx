"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Users,
  Save,
  Loader2,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { Button, Input, RichTextDisplay } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLogisticsPlannerStore } from "../stores/logisticsPlannerStore";
import { CrewMembersList } from "./CrewMembersList";
import { CrewLocationCard } from "./CrewLocationCard";
import type { AidStation } from "@/types";

interface CrewLocation {
  name: string;
  mile_out: number;
  mile_in?: number;
  access_type?: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  shuttle_info?: string;
  notes?: string;
  restrictions?: string;
}

interface CrewPlannerProps {
  racePlanId: string;
  crewLocations: CrewLocation[];
  crewAccessStations: AidStation[];
  distanceMiles: number;
  startTime?: string | null;
  finishTime?: string | null;
  getArrivalTime: (mile: number) => string | null;
  raceCrewInfo?: string | null;
  className?: string;
}

export function CrewPlanner({
  racePlanId,
  crewLocations,
  crewAccessStations,
  distanceMiles,
  startTime,
  finishTime,
  getArrivalTime,
  raceCrewInfo,
  className,
}: CrewPlannerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showContactEditor, setShowContactEditor] = useState(false);

  const {
    crewPlanId,
    setCrewPlanId,
    crewMembers,
    setCrewMembers,
    crewContactInfo,
    setCrewContactInfo,
    crewLocationInstructions,
    setCrewLocationInstructions,
    hasUnsavedChanges,
    markSaved,
  } = useLogisticsPlannerStore();

  const supabase = createClient();

  // Define a unified type for all crew locations
  interface UnifiedCrewLocation {
    name: string;
    mile: number;
    mileIn?: number;
    accessType?: "unlimited" | "limited" | "reserved";
    parkingInfo?: string;
    shuttleInfo?: string;
    notes?: string;
    isRaceDefined: boolean;
  }

  // Combine race-defined crew locations and aid stations with crew access
  const allCrewLocations: UnifiedCrewLocation[] = [
    ...crewLocations.map((loc) => ({
      name: loc.name,
      mile: loc.mile_out,
      mileIn: loc.mile_in,
      accessType: loc.access_type,
      parkingInfo: loc.parking_info,
      shuttleInfo: loc.shuttle_info,
      notes: loc.notes,
      isRaceDefined: true as const,
    })),
    ...crewAccessStations
      .filter((station) => !crewLocations.some((loc) => loc.mile_out === station.mile))
      .map((station) => ({
        name: station.name,
        mile: station.mile,
        notes: station.crew_notes,
        isRaceDefined: false as const,
      })),
  ].sort((a, b) => a.mile - b.mile);

  // Load crew data on mount
  useEffect(() => {
    loadCrewData();
  }, [racePlanId]);

  async function loadCrewData() {
    try {
      const { data: crewPlan } = await supabase
        .from("user_crew_plans")
        .select("*")
        .eq("race_plan_id", racePlanId)
        .single();

      if (crewPlan) {
        setCrewPlanId(crewPlan.id);
        setCrewContactInfo({
          leadName: crewPlan.crew_lead_name,
          leadPhone: crewPlan.crew_lead_phone,
          leadEmail: crewPlan.crew_lead_email,
          generalInstructions: crewPlan.general_instructions,
        });

        // Load crew members
        const { data: members } = await supabase
          .from("crew_members")
          .select("*")
          .eq("crew_plan_id", crewPlan.id)
          .order("sort_order");

        if (members) {
          setCrewMembers(members);
        }

        // Load location instructions
        const { data: instructions } = await supabase
          .from("crew_location_instructions")
          .select("*")
          .eq("crew_plan_id", crewPlan.id);

        if (instructions) {
          instructions.forEach((instr) => {
            setCrewLocationInstructions(instr.location_mile, instr);
          });
        }
      }
    } catch (err) {
      console.error("Error loading crew data:", err);
    }
  }

  // Save crew plan
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save");
        return;
      }

      let planId = crewPlanId;

      // Create or update crew plan
      if (!planId) {
        const { data: newPlan, error: planError } = await supabase
          .from("user_crew_plans")
          .insert({
            user_id: user.id,
            race_plan_id: racePlanId,
            crew_lead_name: crewContactInfo.leadName || null,
            crew_lead_phone: crewContactInfo.leadPhone || null,
            crew_lead_email: crewContactInfo.leadEmail || null,
            general_instructions: crewContactInfo.generalInstructions || null,
          })
          .select("id")
          .single();

        if (planError) throw planError;
        planId = newPlan.id;
        setCrewPlanId(planId);
      } else {
        // Update existing plan
        const { error: updateError } = await supabase
          .from("user_crew_plans")
          .update({
            crew_lead_name: crewContactInfo.leadName || null,
            crew_lead_phone: crewContactInfo.leadPhone || null,
            crew_lead_email: crewContactInfo.leadEmail || null,
            general_instructions: crewContactInfo.generalInstructions || null,
          })
          .eq("id", planId);

        if (updateError) throw updateError;
      }

      // Save crew members
      await supabase
        .from("crew_members")
        .delete()
        .eq("crew_plan_id", planId);

      if (crewMembers.length > 0) {
        const { error: membersError } = await supabase
          .from("crew_members")
          .insert(
            crewMembers.map((m, i) => ({
              crew_plan_id: planId,
              name: m.name,
              phone: m.phone || null,
              email: m.email || null,
              role: m.role || null,
              notes: m.notes || null,
              sort_order: i,
            }))
          );

        if (membersError) throw membersError;
      }

      // Save location instructions
      await supabase
        .from("crew_location_instructions")
        .delete()
        .eq("crew_plan_id", planId);

      const instructionsArray = Array.from(crewLocationInstructions.entries());
      if (instructionsArray.length > 0) {
        const { error: instrError } = await supabase
          .from("crew_location_instructions")
          .insert(
            instructionsArray.map(([mile, instr]) => ({
              crew_plan_id: planId,
              location_mile: mile,
              location_name: instr.location_name,
              expected_arrival_time: instr.expected_arrival_time || null,
              planned_stop_duration_minutes: instr.planned_stop_duration_minutes || null,
              priority_actions: instr.priority_actions || null,
              nutrition_notes: instr.nutrition_notes || null,
              equipment_changes: instr.equipment_changes || null,
              mental_cues: instr.mental_cues || null,
              parking_spot: instr.parking_spot || null,
            }))
          );

        if (instrError) throw instrError;
      }

      markSaved();
      toast.success("Crew plan saved");
    } catch (err) {
      console.error("Error saving crew plan:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [crewPlanId, crewContactInfo, crewMembers, crewLocationInstructions, racePlanId, setCrewPlanId, markSaved, supabase]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Crew Plan</h3>
          <p className="text-sm text-brand-navy-500">
            Coordinate your crew with location instructions and contact info
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Plan
          </Button>
        </div>
      </div>

      {/* Race Crew Info */}
      {raceCrewInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-900">Race Crew Information</p>
              <div className="mt-1 text-sm text-emerald-800">
                <RichTextDisplay content={raceCrewInfo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew Contact Info */}
      <div className="bg-white border border-brand-navy-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-brand-navy-900 flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-navy-400" />
            Crew Lead Contact
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContactEditor(!showContactEditor)}
          >
            {showContactEditor ? "Done" : "Edit"}
          </Button>
        </div>

        {showContactEditor ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-brand-navy-700">Lead Name</label>
              <Input
                value={crewContactInfo.leadName || ""}
                onChange={(e) => setCrewContactInfo({ leadName: e.target.value })}
                placeholder="e.g., Sarah Johnson"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-brand-navy-700">Phone</label>
                <Input
                  type="tel"
                  value={crewContactInfo.leadPhone || ""}
                  onChange={(e) => setCrewContactInfo({ leadPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-navy-700">Email</label>
                <Input
                  type="email"
                  value={crewContactInfo.leadEmail || ""}
                  onChange={(e) => setCrewContactInfo({ leadEmail: e.target.value })}
                  placeholder="sarah@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-navy-700">General Instructions</label>
              <textarea
                value={crewContactInfo.generalInstructions || ""}
                onChange={(e) => setCrewContactInfo({ generalInstructions: e.target.value })}
                placeholder="Overall crew strategy and important notes..."
                className="w-full px-3 py-2 border border-brand-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-sky-500 focus:border-brand-sky-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-brand-navy-600">
            {crewContactInfo.leadName ? (
              <div className="space-y-1">
                <p className="font-medium">{crewContactInfo.leadName}</p>
                {crewContactInfo.leadPhone && (
                  <a
                    href={`tel:${crewContactInfo.leadPhone.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 hover:text-brand-sky-600 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {crewContactInfo.leadPhone}
                  </a>
                )}
                {crewContactInfo.leadEmail && (
                  <a
                    href={`mailto:${crewContactInfo.leadEmail}`}
                    className="flex items-center gap-2 hover:text-brand-sky-600 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {crewContactInfo.leadEmail}
                  </a>
                )}
                {crewContactInfo.generalInstructions && (
                  <p className="flex items-start gap-2 mt-2 text-brand-navy-500">
                    <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {crewContactInfo.generalInstructions}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-brand-navy-400 italic">No crew lead contact set</p>
            )}
          </div>
        )}
      </div>

      {/* Crew Members */}
      <CrewMembersList />

      {/* Timeline with Crew Locations */}
      <div className="relative">
        <h4 className="font-semibold text-brand-navy-900 mb-4">Crew Access Points</h4>

        {/* Course Line */}
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-200" />

        <div className="space-y-4">
          {/* Start */}
          <div className="flex items-center gap-4">
            <div className="relative z-10 h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-brand-navy-900">Start</p>
              <p className="text-sm text-brand-navy-500">
                Mile 0{startTime && <span className="ml-2">• {startTime}</span>}
              </p>
            </div>
          </div>

          {/* Crew Access Points */}
          {allCrewLocations.map((location) => (
            <CrewLocationCard
              key={`${location.name}-${location.mile}`}
              name={location.name}
              mile={location.mile}
              mileIn={location.mileIn}
              accessType={location.accessType}
              parkingInfo={location.parkingInfo}
              shuttleInfo={location.shuttleInfo}
              notes={location.notes}
              arrivalTime={getArrivalTime(location.mile)}
              instructions={crewLocationInstructions.get(location.mile)}
              onUpdateInstructions={(updates) => {
                const existing = crewLocationInstructions.get(location.mile) || {
                  location_mile: location.mile,
                  location_name: location.name,
                };
                setCrewLocationInstructions(location.mile, { ...existing, ...updates });
              }}
            />
          ))}

          {/* Finish */}
          <div className="flex items-center gap-4">
            <div className="relative z-10 h-12 w-12 rounded-full bg-brand-navy-900 flex items-center justify-center shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-brand-navy-900">Finish</p>
              <p className="text-sm text-brand-navy-500">
                Mile {distanceMiles}{finishTime && <span className="ml-2">• {finishTime}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
