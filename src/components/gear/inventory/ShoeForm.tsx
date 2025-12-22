"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserShoe, ShoeType, CleatType } from "@/types/gear";
import { SHOE_TYPE_LABELS, CLEAT_TYPE_LABELS } from "@/types/gear";

interface ShoeFormProps {
  shoe?: UserShoe;
  onSave: () => void;
  onCancel: () => void;
}

export function ShoeForm({ shoe, onSave, onCancel }: ShoeFormProps) {
  const [brand, setBrand] = useState(shoe?.brand || "");
  const [model, setModel] = useState(shoe?.model || "");
  const [shoeType, setShoeType] = useState<ShoeType | "">(shoe?.shoe_type || "");
  const [cleatType, setCleatType] = useState<CleatType | "">(shoe?.cleat_type || "");
  const [notes, setNotes] = useState(shoe?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      brand,
      model,
      shoe_type: shoeType || null,
      cleat_type: cleatType || null,
      notes: notes || null,
    };

    try {
      const url = shoe
        ? `/api/gear/inventory/shoes/${shoe.id}`
        : "/api/gear/inventory/shoes";
      const method = shoe ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(shoe ? "Shoe updated" : "Shoe added");
        onSave();
      }
    } catch {
      toast.error("Failed to save shoe");
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
            placeholder="e.g., Specialized, Giro, Shimano"
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., S-Works Torch, Empire"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shoeType">Shoe Type</Label>
          <select
            id="shoeType"
            value={shoeType}
            onChange={(e) => setShoeType(e.target.value as ShoeType | "")}
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
          >
            <option value="">Select type</option>
            {(Object.entries(SHOE_TYPE_LABELS) as [ShoeType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="cleatType">Cleat System</Label>
          <select
            id="cleatType"
            value={cleatType}
            onChange={(e) => setCleatType(e.target.value as CleatType | "")}
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
          >
            <option value="">Select cleat system</option>
            {(Object.entries(CLEAT_TYPE_LABELS) as [CleatType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this shoe"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {shoe ? "Update" : "Add"} Shoe
        </Button>
      </div>
    </form>
  );
}
