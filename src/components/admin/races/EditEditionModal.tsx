"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { RaceEdition } from "@/types/admin";

interface EditEditionModalProps {
  edition: RaceEdition;
  onClose: () => void;
  onSaved: () => void;
}

export function EditEditionModal({ edition, onClose, onSaved }: EditEditionModalProps) {
  const [year, setYear] = useState(edition.year);
  const [isActive, setIsActive] = useState(edition.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/editions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: edition.id,
          year,
          isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update edition");
        setSaving(false);
        return;
      }

      toast.success("Edition updated!");
      onSaved();
    } catch {
      toast.error("Failed to update edition");
      setSaving(false);
    }
  };

  // Compute date range from distances
  const distanceDates = edition.race_distances
    .map(d => d.date)
    .filter((d): d is string => d !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Edition
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update the {edition.year} edition details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year *</Label>
              <Input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>

            {distanceDates.length > 0 && (
              <div className="p-3 bg-brand-navy-50 rounded-lg">
                <p className="text-sm text-brand-navy-600">
                  <span className="font-medium">Race dates:</span> Set on each distance option
                </p>
                <p className="text-xs text-brand-navy-500 mt-1">
                  Edit individual distances to change their dates
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-brand-navy-300 text-brand-sky-600 focus:ring-brand-sky-500"
              />
              <Label htmlFor="edit-is-active" className="text-sm font-normal">
                Active edition (visible to athletes)
              </Label>
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
