"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Mountain,
  FileUp,
  Loader2,
  CheckCircle,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDateShort } from "@/lib/utils";
import { useGpxUpload } from "@/hooks";
import { toast } from "sonner";
import type { RaceDistance } from "@/types/admin";
import { AidStationsModal } from "./AidStationsModal";
import { EditDistanceModal } from "./EditDistanceModal";

interface DistanceRowProps {
  distance: RaceDistance;
  raceSlug: string;
  editionYear: number;
  onRefresh: () => void;
}

export function DistanceRow({ distance, raceSlug, editionYear, onRefresh }: DistanceRowProps) {
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
    } catch {
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
