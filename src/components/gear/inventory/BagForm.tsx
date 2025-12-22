"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserBag, BagType } from "@/types/gear";
import { BAG_TYPE_LABELS } from "@/types/gear";

interface BagFormProps {
  bag?: UserBag;
  onSave: () => void;
  onCancel: () => void;
}

export function BagForm({ bag, onSave, onCancel }: BagFormProps) {
  const [brand, setBrand] = useState(bag?.brand || "");
  const [model, setModel] = useState(bag?.model || "");
  const [bagType, setBagType] = useState<BagType>(bag?.bag_type || "saddle");
  const [capacityLiters, setCapacityLiters] = useState(
    bag?.capacity_liters?.toString() || ""
  );
  const [notes, setNotes] = useState(bag?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      brand,
      model,
      bag_type: bagType,
      capacity_liters: capacityLiters ? parseFloat(capacityLiters) : null,
      notes: notes || null,
    };

    try {
      const url = bag
        ? `/api/gear/inventory/bags/${bag.id}`
        : "/api/gear/inventory/bags";
      const method = bag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(bag ? "Bag updated" : "Bag added");
        onSave();
      }
    } catch {
      toast.error("Failed to save bag");
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
            placeholder="e.g., Apidura, Revelate, Ortlieb"
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., Expedition Saddle Pack"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bagType">Type</Label>
          <select
            id="bagType"
            value={bagType}
            onChange={(e) => setBagType(e.target.value as BagType)}
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
          >
            {(Object.entries(BAG_TYPE_LABELS) as [BagType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="capacityLiters">Capacity (L)</Label>
          <Input
            id="capacityLiters"
            type="number"
            step="0.1"
            value={capacityLiters}
            onChange={(e) => setCapacityLiters(e.target.value)}
            placeholder="e.g., 14"
            min="0.1"
            max="20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this bag"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {bag ? "Update" : "Add"} Bag
        </Button>
      </div>
    </form>
  );
}
