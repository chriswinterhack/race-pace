"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserClothing, ClothingType } from "@/types/gear";
import { CLOTHING_TYPE_LABELS } from "@/types/gear";

interface ClothingFormProps {
  clothing?: UserClothing;
  onSave: () => void;
  onCancel: () => void;
}

export function ClothingForm({ clothing, onSave, onCancel }: ClothingFormProps) {
  const [name, setName] = useState(clothing?.name || "");
  const [brand, setBrand] = useState(clothing?.brand || "");
  const [clothingType, setClothingType] = useState<ClothingType>(
    clothing?.clothing_type || "jersey"
  );
  const [notes, setNotes] = useState(clothing?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      brand: brand || null,
      clothing_type: clothingType,
      notes: notes || null,
    };

    try {
      const url = clothing
        ? `/api/gear/inventory/clothing/${clothing.id}`
        : "/api/gear/inventory/clothing";
      const method = clothing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(clothing ? "Clothing updated" : "Clothing added");
        onSave();
      }
    } catch {
      toast.error("Failed to save clothing");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wind Vest, Arm Warmers"
            required
          />
        </div>
        <div>
          <Label htmlFor="brand">Brand (optional)</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Rapha, Castelli"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="clothingType">Type</Label>
        <select
          id="clothingType"
          value={clothingType}
          onChange={(e) => setClothingType(e.target.value as ClothingType)}
          className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
        >
          {(Object.entries(CLOTHING_TYPE_LABELS) as [ClothingType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this item"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {clothing ? "Update" : "Add"} Item
        </Button>
      </div>
    </form>
  );
}
