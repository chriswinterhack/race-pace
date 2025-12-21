"use client";

import { Bike, Wrench, Package } from "lucide-react";

interface RacePlan {
  id: string;
}

interface GearSectionProps {
  plan: RacePlan;
}

export function GearSection({ plan: _plan }: GearSectionProps) {
  // plan is available for future gear selection implementation
  void _plan;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-navy-900">Gear Setup</h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          Select equipment for race day
        </p>
      </div>

      <div className="text-center py-12 bg-brand-navy-50 rounded-lg">
        <Bike className="h-8 w-8 text-brand-navy-300 mx-auto mb-3" />
        <p className="text-brand-navy-600 mb-2">Gear selection coming soon</p>
        <p className="text-sm text-brand-navy-500">
          Track your bike setup, tires, and repair kit
        </p>
      </div>

      {/* Preview of future features */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-lg border border-dashed border-brand-navy-200">
          <Bike className="h-5 w-5 text-brand-navy-400 mb-2" />
          <p className="font-medium text-brand-navy-700">Bike Setup</p>
          <p className="text-sm text-brand-navy-500">Brand, model, components</p>
        </div>
        <div className="p-4 rounded-lg border border-dashed border-brand-navy-200">
          <Package className="h-5 w-5 text-brand-navy-400 mb-2" />
          <p className="font-medium text-brand-navy-700">Tires</p>
          <p className="text-sm text-brand-navy-500">Brand, size, pressure</p>
        </div>
        <div className="p-4 rounded-lg border border-dashed border-brand-navy-200">
          <Wrench className="h-5 w-5 text-brand-navy-400 mb-2" />
          <p className="font-medium text-brand-navy-700">Repair Kit</p>
          <p className="text-sm text-brand-navy-500">Tools and spares</p>
        </div>
      </div>
    </div>
  );
}
