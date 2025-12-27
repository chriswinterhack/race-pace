"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useGpxUpload } from "@/hooks";
import { toast } from "sonner";

interface AddDistanceModalProps {
  editionId: string;
  editionYear: number;
  raceSlug: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AddDistanceModal({
  editionId,
  editionYear,
  raceSlug,
  onClose,
  onCreated,
}: AddDistanceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    distance_miles: "",
    date: "",
    start_time: "",
    elevation_gain: "",
  });
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { upload, isUploading, progress } = useGpxUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let gpxUrl = null;
    if (gpxFile) {
      const result = await upload(gpxFile, raceSlug, editionYear);
      if (result) {
        gpxUrl = result.url;
      } else {
        toast.error("Failed to upload GPX");
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/distances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          race_edition_id: editionId,
          name: formData.name || null,
          distance_miles: parseFloat(formData.distance_miles),
          date: formData.date || null,
          start_time: formData.start_time || null,
          elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : null,
          gpx_file_url: gpxUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to create distance");
        setSaving(false);
        return;
      }

      toast.success("Distance added!");
      onCreated();
    } catch {
      toast.error("Failed to create distance");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Add Distance
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Add a new distance option for {editionYear}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (miles) *</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance_miles}
                  onChange={(e) => setFormData({ ...formData, distance_miles: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., XL, Black, Sprint"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevation">Elevation Gain (ft)</Label>
              <Input
                id="elevation"
                type="number"
                value={formData.elevation_gain}
                onChange={(e) => setFormData({ ...formData, elevation_gain: e.target.value })}
                placeholder="4500"
              />
            </div>

            <div className="space-y-2">
              <Label>GPX File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  gpxFile ? "border-emerald-300 bg-emerald-50" : "border-brand-navy-200 hover:border-brand-sky-400"
                )}
              >
                <input
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="gpx-upload-modal"
                />
                <label htmlFor="gpx-upload-modal" className="cursor-pointer">
                  {gpxFile ? (
                    <span className="text-sm text-emerald-700">{gpxFile.name}</span>
                  ) : (
                    <span className="text-sm text-brand-navy-500">Click to select GPX</span>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || isUploading}>
                {(saving || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploading ? `Uploading ${progress}%` : "Add Distance"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
