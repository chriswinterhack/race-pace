"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, CheckCircle2, Circle, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  href?: string;
  action?: string;
}

interface GettingStartedCardProps {
  hasRace: boolean;
  hasFtp: boolean;
  hasWeight: boolean;
  hasGoalTime: boolean;
  hasSplits: boolean;
  raceId?: string;
  onAddRaceClick: () => void;
}

const DISMISSED_KEY = "racepace_getting_started_dismissed";

export function GettingStartedCard({
  hasRace,
  hasFtp,
  hasWeight,
  hasGoalTime,
  hasSplits,
  raceId,
  onAddRaceClick,
}: GettingStartedCardProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    setDismissed(isDismissed);
  }, []);

  const items: ChecklistItem[] = [
    {
      id: "race",
      label: "Add your first race",
      description: "Pick an upcoming race to start planning",
      complete: hasRace,
      action: "add-race",
    },
    {
      id: "profile",
      label: "Set up your athlete profile",
      description: "Add your FTP and weight for personalized targets",
      complete: hasFtp && hasWeight,
      href: "/dashboard/settings?section=athlete",
    },
    {
      id: "goal",
      label: "Set your race goal",
      description: "Choose a target finish time",
      complete: hasGoalTime,
      href: raceId ? `/dashboard/race/${raceId}?section=goal` : undefined,
    },
    {
      id: "splits",
      label: "Generate your race splits",
      description: "Get personalized pacing for each segment",
      complete: hasSplits,
      href: raceId ? `/dashboard/race/${raceId}?section=pacing` : undefined,
    },
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const allComplete = completedCount === items.length;

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.action === "add-race") {
      onAddRaceClick();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 p-6 shadow-lg">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
        aria-label="Dismiss getting started guide"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="relative flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-brand-sky-500/20">
          <Sparkles className="h-5 w-5 text-brand-sky-400" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-white">
            Getting Started
          </h3>
          <p className="text-sm text-white/60">
            {completedCount} of {items.length} complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-sky-400 to-brand-sky-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="relative space-y-2">
        {items.map((item) => {
          const isClickable = !item.complete && (item.href || item.action);
          const itemClassName = cn(
            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
            item.complete
              ? "bg-white/5"
              : isClickable
                ? "bg-white/10 hover:bg-white/15 cursor-pointer"
                : "bg-white/5 opacity-60"
          );

          const content = (
            <>
              {item.complete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-white/30 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    item.complete ? "text-white/50 line-through" : "text-white"
                  )}
                >
                  {item.label}
                </p>
                {!item.complete && (
                  <p className="text-xs text-white/40 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              {isClickable && (
                <ChevronRight className="h-4 w-4 text-white/40 flex-shrink-0" />
              )}
            </>
          );

          if (item.href && !item.complete) {
            return (
              <Link key={item.id} href={item.href} className={itemClassName}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              disabled={item.complete || !item.action}
              className={itemClassName}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
