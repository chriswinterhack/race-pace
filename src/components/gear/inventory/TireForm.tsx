"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Label } from "@/components/ui";
import { toast } from "sonner";
import type { UserTire, TireType, TireWidthUnit } from "@/types/gear";
import { TIRE_TYPE_LABELS, TIRE_WIDTH_OPTIONS_MM, TIRE_WIDTH_OPTIONS_IN } from "@/types/gear";

interface TireFormProps {
  tire?: UserTire;
  onSave: () => void;
  onCancel: () => void;
}

export function TireForm({ tire, onSave, onCancel }: TireFormProps) {
  const [brand, setBrand] = useState(tire?.brand || "");
  const [model, setModel] = useState(tire?.model || "");
  const [widthUnit, setWidthUnit] = useState<TireWidthUnit>(tire?.width_unit || "mm");
  const [widthValue, setWidthValue] = useState<string>(tire?.width_value?.toString() || "");
  const [tireType, setTireType] = useState<TireType | "">(tire?.tire_type || "");
  const [notes, setNotes] = useState(tire?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!widthValue) {
      toast.error("Please select a tire width");
      return;
    }

    const parsedWidth = parseFloat(widthValue);
    if (isNaN(parsedWidth) || parsedWidth <= 0) {
      toast.error("Please select a valid tire width");
      return;
    }

    setSaving(true);

    const data = {
      brand,
      model,
      width_value: parsedWidth,
      width_unit: widthUnit,
      tire_type: tireType || null,
      notes: notes || null,
    };

    try {
      const url = tire
        ? `/api/gear/inventory/tires/${tire.id}`
        : "/api/gear/inventory/tires";
      const method = tire ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(tire ? "Tire updated" : "Tire added");
        onSave();
      }
    } catch {
      toast.error("Failed to save tire");
    }

    setSaving(false);
  };

  // Reset width value when unit changes
  const handleUnitChange = (newUnit: TireWidthUnit) => {
    setWidthUnit(newUnit);
    setWidthValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Maxxis, Schwalbe, Vittoria"
            required
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900 placeholder:text-brand-navy-400"
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., Rambler, G-One, Terreno Dry"
            required
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900 placeholder:text-brand-navy-400"
          />
        </div>
      </div>

      {/* Width Unit Toggle */}
      <div>
        <Label>Width Unit</Label>
        <div className="flex gap-2 mt-1.5">
          <button
            type="button"
            onClick={() => handleUnitChange("mm")}
            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
              widthUnit === "mm"
                ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                : "border-brand-navy-200 hover:border-brand-navy-300 text-brand-navy-700"
            }`}
          >
            Millimeters (Road/Gravel)
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange("in")}
            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
              widthUnit === "in"
                ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                : "border-brand-navy-200 hover:border-brand-navy-300 text-brand-navy-700"
            }`}
          >
            Inches (MTB)
          </button>
        </div>
      </div>

      {/* Width Selection */}
      <div>
        <Label htmlFor="width">Width</Label>
        <select
          id="width"
          value={widthValue}
          onChange={(e) => setWidthValue(e.target.value)}
          required
          className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
        >
          <option value="">Select width</option>
          {widthUnit === "mm" && (
            <>
              <optgroup label="Road">
                {TIRE_WIDTH_OPTIONS_MM.filter(o => o.category === "road").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Gravel">
                {TIRE_WIDTH_OPTIONS_MM.filter(o => o.category === "gravel").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </>
          )}
          {widthUnit === "in" && (
            <>
              <optgroup label="MTB / Cross-Country">
                {TIRE_WIDTH_OPTIONS_IN.filter(o => o.category === "mtb").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Plus Size">
                {TIRE_WIDTH_OPTIONS_IN.filter(o => o.category === "plus").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </>
          )}
        </select>
      </div>

      <div>
        <Label htmlFor="tireType">Tire Type</Label>
        <select
          id="tireType"
          value={tireType}
          onChange={(e) => setTireType(e.target.value as TireType | "")}
          className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
        >
          <option value="">Select type</option>
          {(Object.entries(TIRE_TYPE_LABELS) as [TireType, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <input
          id="notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this tire"
          className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900 placeholder:text-brand-navy-400"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {tire ? "Update" : "Add"} Tire
        </Button>
      </div>
    </form>
  );
}
