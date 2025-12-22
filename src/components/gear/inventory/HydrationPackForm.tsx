"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserHydrationPack } from "@/types/gear";

interface HydrationPackFormProps {
  pack?: UserHydrationPack;
  onSave: () => void;
  onCancel: () => void;
}

export function HydrationPackForm({ pack, onSave, onCancel }: HydrationPackFormProps) {
  const [brand, setBrand] = useState(pack?.brand || "");
  const [model, setModel] = useState(pack?.model || "");
  const [capacityLiters, setCapacityLiters] = useState(
    pack?.capacity_liters?.toString() || ""
  );
  const [notes, setNotes] = useState(pack?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      brand,
      model,
      capacity_liters: capacityLiters ? parseFloat(capacityLiters) : null,
      notes: notes || null,
    };

    try {
      const url = pack
        ? `/api/gear/inventory/hydration-packs/${pack.id}`
        : "/api/gear/inventory/hydration-packs";
      const method = pack ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(pack ? "Hydration pack updated" : "Hydration pack added");
        onSave();
      }
    } catch {
      toast.error("Failed to save hydration pack");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Salomon, Nathan, CamelBak"
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., ADV Skin 12, VaporHowe"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="capacityLiters">Capacity (L)</Label>
        <Input
          id="capacityLiters"
          type="number"
          step="0.5"
          value={capacityLiters}
          onChange={(e) => setCapacityLiters(e.target.value)}
          placeholder="e.g., 12"
          min="0.5"
          max="20"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this pack"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {pack ? "Update" : "Add"} Pack
        </Button>
      </div>
    </form>
  );
}
