"use client";

import { useState } from "react";
import { Gauge, ChevronDown } from "lucide-react";
import { EFFORT_PRESETS, EFFORT_COLORS, type EffortPreset } from "./types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface EffortPresetsProps {
  onApplyPreset: (preset: EffortPreset) => void;
}

export function EffortPresets({ onApplyPreset }: EffortPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "border-white/20 text-brand-navy-300",
          "hover:bg-white/10 hover:text-white",
          isOpen && "bg-white/10 text-white"
        )}
      >
        <Gauge className="h-4 w-4 mr-2" />
        Effort Presets
        <ChevronDown
          className={cn(
            "h-4 w-4 ml-2 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={cn(
              "absolute top-full left-0 mt-2 z-50",
              "w-72 rounded-xl overflow-hidden",
              "bg-brand-navy-900/98 backdrop-blur-xl",
              "border border-white/10",
              "shadow-2xl shadow-black/50",
              "animate-in fade-in slide-in-from-top-2 duration-200"
            )}
          >
            <div className="p-2">
              {(Object.entries(EFFORT_PRESETS) as [EffortPreset, typeof EFFORT_PRESETS[EffortPreset]][]).map(
                ([key, preset]) => {
                  const defaultConfig = EFFORT_COLORS[preset.defaultEffort];

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onApplyPreset(key);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg",
                        "flex items-start gap-3",
                        "text-left",
                        "hover:bg-white/10 transition-colors"
                      )}
                    >
                      {/* Single effort indicator - use the primary/default effort color */}
                      <span
                        className={cn("w-3 h-3 rounded-full mt-1 shrink-0", defaultConfig.badge)}
                      />

                      {/* Label and description */}
                      <div className="flex-1">
                        <div className="text-white font-medium">{preset.label}</div>
                        <div className="text-sm text-brand-navy-400 mt-0.5">
                          {preset.description}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-brand-navy-500">
                          <span>
                            Flats: <span className="text-brand-navy-300">{preset.defaultEffort}</span>
                          </span>
                          <span>
                            Climbs: <span className="text-brand-navy-300">{preset.climbEffort}</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Info footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/5">
              <p className="text-xs text-brand-navy-500">
                Presets automatically adjust effort levels based on terrain gradient.
                Segments with 2%+ grade are classified as climbs.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
