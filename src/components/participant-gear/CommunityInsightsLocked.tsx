"use client";

import { Lock, Bike, Circle, Wrench, Footprints, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

interface CommunityInsightsLockedProps {
  participantCount: number;
  onUpgrade: () => void;
}

// Blurred placeholder data
const PLACEHOLDER_BIKES = [
  { name: "████████ ██████", count: "██" },
  { name: "██████ ████████", count: "█" },
  { name: "████ ██████████", count: "█" },
];

const PLACEHOLDER_TIRES = [
  { name: "██████████ ██████", width: "45mm", count: "██" },
  { name: "████████ ████", width: "42mm", count: "█" },
  { name: "██████ ██████", width: "40mm", count: "█" },
];

const PLACEHOLDER_ITEMS = ["██████", "████ ████", "██████████", "████", "██████"];

export function CommunityInsightsLocked({ participantCount, onUpgrade }: CommunityInsightsLockedProps) {
  return (
    <div className="space-y-6">
      {/* Header with count teaser */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-navy-900">Popular Choices</h3>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-sky-100 text-brand-sky-700">
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{participantCount} riders</span>
        </div>
      </div>

      {/* Locked Preview Cards */}
      <div className="relative">
        {/* Blurred content */}
        <div className="space-y-4 filter blur-[2px] select-none pointer-events-none">
          {/* Bikes */}
          <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
            <div className="px-4 py-3 bg-brand-sky-50 border-b border-brand-sky-100">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-brand-sky-600" />
                <span className="font-semibold text-brand-sky-900 text-sm">Bikes</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {PLACEHOLDER_BIKES.map((bike, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-navy-400">{bike.name}</span>
                  <span className="text-xs font-medium text-brand-navy-300">{bike.count} riders</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tires */}
          <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-amber-900 text-sm">Tires</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {PLACEHOLDER_TIRES.map((tire, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-navy-400">
                    {tire.name} <span className="text-brand-navy-300">({tire.width})</span>
                  </span>
                  <span className="text-xs font-medium text-brand-navy-300">{tire.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shoes */}
          <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-900 text-sm">Shoes</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {PLACEHOLDER_BIKES.map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-navy-400">████████ ██████</span>
                  <span className="text-xs font-medium text-brand-navy-300">█ riders</span>
                </div>
              ))}
            </div>
          </div>

          {/* Repair Kit */}
          <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">Repair Essentials</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDER_ITEMS.map((item, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs font-medium text-purple-400 bg-purple-50 border border-purple-100 rounded-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 via-white/80 to-white/95 rounded-xl">
          <div className="text-center px-4 py-6 max-w-xs">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-sky-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-sky-500/25">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-brand-navy-900 mb-2">
              See What Others Are Running
            </h4>
            <p className="text-sm text-brand-navy-600 mb-4">
              Unlock community insights to see the most popular bikes, tires, and gear for this race.
            </p>
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-brand-sky-500 to-purple-500 hover:from-brand-sky-600 hover:to-purple-600 text-white shadow-md gap-2"
            >
              Unlock Community Gear
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-xs text-brand-navy-500">
              Included with Premium • $29/year
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
