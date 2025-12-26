"use client";

import { useState } from "react";
import { FileText, Download, Printer, Watch } from "lucide-react";
import { Button } from "@/components/ui";
import { GarminExportModal } from "@/components/garmin";

interface RacePlan {
  id: string;
  goal_time_minutes: number | null;
  race_distance: {
    name: string | null;
    distance_miles: number;
    race_edition: {
      race: {
        name: string;
      };
    };
  };
  segments: Array<{
    id: string;
    start_name: string | null;
    end_name: string | null;
    target_time_minutes: number;
  }>;
}

interface ExportSectionProps {
  plan: RacePlan;
  isSubscribed?: boolean;
}

export function ExportSection({ plan, isSubscribed = false }: ExportSectionProps) {
  const [showGarminModal, setShowGarminModal] = useState(false);
  const hasSegments = plan.segments.length > 0;
  const hasGoalTime = !!plan.goal_time_minutes;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">Export Plan</h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Download your race plan for race day
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Garmin Sync */}
        <div className="p-6 rounded-lg border border-brand-navy-200 hover:border-brand-sky-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-50">
              <Watch className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-brand-navy-900">Garmin Sync</h4>
              <p className="mt-1 text-sm text-brand-navy-600">
                View checkpoints and power targets on your Garmin
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={!hasSegments}
                onClick={() => setShowGarminModal(true)}
              >
                <Watch className="h-4 w-4 mr-2" />
                Sync to Garmin
              </Button>
              {!hasSegments && (
                <p className="mt-2 text-xs text-brand-navy-500">
                  Add pacing segments first
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Tube Sticker */}
        <div className="p-6 rounded-lg border border-brand-navy-200 hover:border-brand-sky-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-brand-sky-50">
              <Printer className="h-6 w-6 text-brand-sky-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-brand-navy-900">Top Tube Sticker</h4>
              <p className="mt-1 text-sm text-brand-navy-600">
                Compact reference card to tape to your bike
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={!hasSegments}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
              {!hasSegments && (
                <p className="mt-2 text-xs text-brand-navy-500">
                  Add pacing segments first
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full Race Plan PDF */}
        <div className="p-6 rounded-lg border border-brand-navy-200 hover:border-brand-sky-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-brand-navy-50">
              <FileText className="h-6 w-6 text-brand-navy-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-brand-navy-900">Full Race Plan</h4>
              <p className="mt-1 text-sm text-brand-navy-600">
                Complete PDF with all details, power targets, and nutrition
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={!hasGoalTime}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {!hasGoalTime && (
                <p className="mt-2 text-xs text-brand-navy-500">
                  Set a goal time first
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticker Preview */}
      {hasSegments && (
        <div className="p-4 rounded-lg bg-brand-navy-50">
          <h4 className="font-medium text-brand-navy-900 mb-3">Sticker Preview</h4>
          <div className="bg-white rounded border border-brand-navy-200 p-4 max-w-md">
            <p className="font-bold text-brand-navy-900 text-sm mb-2">
              {plan.race_distance.race_edition.race.name}
            </p>
            <div className="space-y-1">
              {plan.segments.slice(0, 5).map((segment, index) => (
                <div
                  key={segment.id}
                  className="flex justify-between text-xs font-mono"
                >
                  <span className="text-brand-navy-600">
                    {segment.end_name || `Seg ${index + 1}`}
                  </span>
                  <span className="text-brand-navy-900">
                    {Math.floor(segment.target_time_minutes / 60)}:
                    {String(Math.round(segment.target_time_minutes % 60)).padStart(2, "0")}
                  </span>
                </div>
              ))}
              {plan.segments.length > 5 && (
                <p className="text-xs text-brand-navy-500">
                  +{plan.segments.length - 5} more segments
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Garmin Export Modal */}
      <GarminExportModal
        open={showGarminModal}
        onClose={() => setShowGarminModal(false)}
        racePlanId={plan.id}
        isSubscribed={isSubscribed}
      />
    </div>
  );
}
