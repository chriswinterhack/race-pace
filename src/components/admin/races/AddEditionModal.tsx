"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AddEditionModalProps {
  raceId: string;
  raceName: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AddEditionModal({ raceId, raceName, onClose, onCreated }: AddEditionModalProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear + 1);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("race_editions").insert({
      race_id: raceId,
      year,
      is_active: true,
    });

    if (error) {
      toast.error(error.message || "Failed to create edition");
      setSaving(false);
    } else {
      toast.success("Edition created!");
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Add Edition
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Create a new edition for {raceName}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>
            <p className="text-xs text-brand-navy-500">
              After creating the edition, add distances with their specific race dates.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Edition
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
