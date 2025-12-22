"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserRepairKit } from "@/types/gear";

interface RepairKitFormProps {
  kit?: UserRepairKit;
  onSave: () => void;
  onCancel: () => void;
}

const COMMON_ITEMS = [
  "Tire plug kit",
  "CO2 cartridges",
  "Mini pump",
  "Spare tube",
  "Tire levers",
  "Multi-tool",
  "Chain quick link",
  "Duct tape",
  "Zip ties",
  "Derailleur hanger",
];

export function RepairKitForm({ kit, onSave, onCancel }: RepairKitFormProps) {
  const [name, setName] = useState(kit?.name || "");
  const [items, setItems] = useState<string[]>(kit?.items || []);
  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState(kit?.notes || "");
  const [saving, setSaving] = useState(false);

  const addItem = (item: string) => {
    if (item && !items.includes(item)) {
      setItems([...items, item]);
    }
    setNewItem("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      items,
      notes: notes || null,
    };

    try {
      const url = kit
        ? `/api/gear/inventory/repair-kits/${kit.id}`
        : "/api/gear/inventory/repair-kits";
      const method = kit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(kit ? "Repair kit updated" : "Repair kit added");
        onSave();
      }
    } catch {
      toast.error("Failed to save repair kit");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Kit Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Gravel Race Kit"
          required
        />
      </div>

      <div>
        <Label>Items</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-navy-100 text-brand-navy-700 rounded-full text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(newItem);
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => addItem(newItem)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2">
          <p className="text-xs text-brand-navy-500 mb-1">Quick add:</p>
          <div className="flex flex-wrap gap-1">
            {COMMON_ITEMS.filter((item) => !items.includes(item)).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addItem(item)}
                className="text-xs px-2 py-1 bg-brand-navy-50 text-brand-navy-600 rounded hover:bg-brand-navy-100"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this kit"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {kit ? "Update" : "Add"} Kit
        </Button>
      </div>
    </form>
  );
}
