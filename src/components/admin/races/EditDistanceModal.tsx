"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RaceDistance, SurfaceComposition, DistanceRaceType } from "@/types/admin";
import { RACE_TYPE_OPTIONS } from "@/types/admin";

interface EditDistanceModalProps {
  distance: RaceDistance;
  onClose: () => void;
  onSaved: () => void;
}

export function EditDistanceModal({ distance, onClose, onSaved }: EditDistanceModalProps) {
  const [formData, setFormData] = useState({
    name: distance.name || "",
    distance_miles: distance.distance_miles.toString(),
    date: distance.date || "",
    start_time: distance.start_time || "",
    elevation_gain: distance.elevation_gain?.toString() || "",
    race_type: (distance.race_type || "gravel") as DistanceRaceType,
  });
  const [surface, setSurface] = useState<SurfaceComposition>(
    distance.surface_composition || {}
  );
  const [saving, setSaving] = useState(false);

  // Calculate total percentage
  const totalPercent = Object.values(surface).reduce((sum, val) => sum + (val || 0), 0);

  const handleSurfaceChange = (key: keyof SurfaceComposition, value: string) => {
    const numValue = parseInt(value) || 0;
    setSurface({ ...surface, [key]: numValue > 0 ? numValue : undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Clean surface composition (remove zero/undefined values)
    const cleanedSurface: SurfaceComposition = {};
    Object.entries(surface).forEach(([key, val]) => {
      if (val && val > 0) {
        cleanedSurface[key as keyof SurfaceComposition] = val;
      }
    });

    try {
      const response = await fetch("/api/admin/distances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distanceId: distance.id,
          name: formData.name || null,
          distance_miles: parseFloat(formData.distance_miles),
          date: formData.date || null,
          start_time: formData.start_time || null,
          elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : null,
          surface_composition: Object.keys(cleanedSurface).length > 0 ? cleanedSurface : null,
          race_type: formData.race_type,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update distance");
        setSaving(false);
        return;
      }

      toast.success("Distance updated!");
      onSaved();
    } catch {
      toast.error("Failed to update distance");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Distance
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update distance details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-dist-miles">Distance (miles) *</Label>
                <Input
                  id="edit-dist-miles"
                  type="number"
                  step="0.1"
                  value={formData.distance_miles}
                  onChange={(e) => setFormData({ ...formData, distance_miles: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dist-name">Name (optional)</Label>
                <Input
                  id="edit-dist-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., XL, Black, Sprint"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-dist-date">Race Date</Label>
                <Input
                  id="edit-dist-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dist-time">Start Time</Label>
                <Input
                  id="edit-dist-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dist-elevation">Elevation Gain (ft)</Label>
              <Input
                id="edit-dist-elevation"
                type="number"
                value={formData.elevation_gain}
                onChange={(e) => setFormData({ ...formData, elevation_gain: e.target.value })}
                placeholder="4500"
              />
            </div>

            {/* Race Type for Power Calculation */}
            <div className="space-y-2">
              <Label>Race Type (Power Adjustment)</Label>
              <p className="text-xs text-brand-navy-500">
                Affects real-world power adjustment for goal time calculations
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {RACE_TYPE_OPTIONS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, race_type: value })}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-colors",
                      formData.race_type === value
                        ? "border-brand-sky-500 bg-brand-sky-50"
                        : "border-brand-navy-200 hover:border-brand-navy-300"
                    )}
                  >
                    <div className="font-medium text-sm text-brand-navy-900">{label}</div>
                    <div className="text-xs text-brand-navy-500 mt-0.5">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Surface Composition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Surface Composition</Label>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded",
                  totalPercent === 100 ? "bg-emerald-100 text-emerald-700" :
                  totalPercent === 0 ? "bg-brand-navy-100 text-brand-navy-500" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {totalPercent}% total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "gravel", label: "Gravel" },
                  { key: "pavement", label: "Pavement" },
                  { key: "singletrack", label: "Singletrack" },
                  { key: "doubletrack", label: "Doubletrack" },
                  { key: "dirt", label: "Dirt Road" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={surface[key as keyof SurfaceComposition] || ""}
                      onChange={(e) => handleSurfaceChange(key as keyof SurfaceComposition, e.target.value)}
                      className="w-20 h-9"
                      placeholder="0"
                    />
                    <span className="text-sm text-brand-navy-600">% {label}</span>
                  </div>
                ))}
              </div>
              {totalPercent > 0 && totalPercent !== 100 && (
                <p className="text-xs text-amber-600">
                  Surface percentages should add up to 100%
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
