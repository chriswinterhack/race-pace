"use client";

import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface RacePlan {
  id: string;
}

interface ChecklistSectionProps {
  plan: RacePlan;
}

export function ChecklistSection({ plan: _plan }: ChecklistSectionProps) {
  // plan is available for future checklist implementation
  void _plan;
  const categories = [
    { name: "On Bike", items: ["Bottles", "Food", "Tools", "Spares"] },
    { name: "Drop Bag", items: ["Change of clothes", "Extra food", "Battery pack"] },
    { name: "Race Morning", items: ["Bib pickup", "Bike check", "Warm up"] },
    { name: "Jersey Pockets", items: ["Phone", "Cash/card", "ID", "Gels"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Race Checklist</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Track your packing and race day preparation
          </p>
        </div>
        <Button variant="outline" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="text-center py-8 bg-brand-navy-50 rounded-lg">
        <CheckSquare className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
        <p className="text-brand-navy-600 mb-2">Checklist coming soon</p>
        <p className="text-sm text-brand-navy-500">
          Create custom packing lists for race day
        </p>
      </div>

      {/* Preview categories */}
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className="p-4 rounded-lg border border-dashed border-brand-navy-200"
          >
            <h4 className="font-medium text-brand-navy-700 mb-3">{category.name}</h4>
            <ul className="space-y-2">
              {category.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-brand-navy-500"
                >
                  <div className="h-4 w-4 rounded border border-brand-navy-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
