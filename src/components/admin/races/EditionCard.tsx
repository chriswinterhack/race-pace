"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Plus } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { cn, formatDateRange } from "@/lib/utils";
import type { RaceEdition } from "@/types/admin";
import { DistanceRow } from "./DistanceRow";
import { AddDistanceModal } from "./AddDistanceModal";
import { EditEditionModal } from "./EditEditionModal";

interface EditionCardProps {
  edition: RaceEdition;
  raceSlug: string;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

export function EditionCard({ edition, raceSlug, expanded, onToggle, onRefresh }: EditionCardProps) {
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
