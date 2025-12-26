"use client";

import { Bike, Users, TrendingUp, Sparkles, ArrowRight, Circle, Wrench, Footprints } from "lucide-react";
import { Button } from "@/components/ui";

interface GearSetupPromptProps {
  raceName: string;
  participantCount: number;
  onGetStarted: () => void;
  isPremium: boolean;
}

export function GearSetupPrompt({ raceName, participantCount, onGetStarted, isPremium }: GearSetupPromptProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900 p-8 text-white">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-brand-sky-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-48 w-48 rounded-full bg-brand-sky-400/10 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
            <Bike className="h-8 w-8 text-brand-sky-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">What&apos;s Your Race Setup?</h3>
            <p className="text-brand-sky-200 mt-1">
              Track your gear for {raceName}
            </p>
          </div>
        </div>

        {/* Gear slots preview */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { icon: Bike, label: "Bike" },
            { icon: Circle, label: "Front Tire" },
            { icon: Circle, label: "Rear Tire" },
            { icon: Footprints, label: "Shoes" },
            { icon: Wrench, label: "Repair Kit" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center mb-1.5">
                <Icon className="h-5 w-5 text-white/50" />
              </div>
              <span className="text-xs text-white/60">{label}</span>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Remember Your Setup</p>
              <p className="text-xs text-white/60 mt-0.5">Never forget what worked</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Help Other Riders</p>
              <p className="text-xs text-white/60 mt-0.5">Share what you&apos;re running</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="p-1.5 rounded-lg bg-brand-sky-500/20">
              <TrendingUp className="h-4 w-4 text-brand-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {isPremium ? "See Popular Choices" : "Compare Gear"}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {isPremium
                  ? `${participantCount} riders shared`
                  : "Upgrade to see trends"}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={onGetStarted}
          size="lg"
          className="w-full sm:w-auto bg-white text-brand-navy-900 hover:bg-brand-sky-50 shadow-lg gap-2"
        >
          Start Adding Gear
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
