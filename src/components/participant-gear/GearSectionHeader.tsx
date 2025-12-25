import { Users, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CommunityStats } from "./types";

interface GearSectionHeaderProps {
  raceName: string;
  communityStats: CommunityStats | null;
  completionPercent: number;
  isPublic: boolean;
  hasChanges: boolean;
  saving: boolean;
  onTogglePublic: () => void;
  onSave: () => void;
}

export function GearSectionHeader({
  raceName,
  communityStats,
  completionPercent,
  isPublic,
  hasChanges,
  saving,
  onTogglePublic,
  onSave,
}: GearSectionHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sky-900 p-6 sm:p-8 text-white">
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-brand-sky-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-brand-sky-400/10 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Participant Gear</h2>
          <p className="mt-1 text-brand-sky-100/80">
            Your race setup & community insights for {raceName}
          </p>

          {/* Community stats */}
          {communityStats && communityStats.publicCount > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                <Users className="h-4 w-4 text-brand-sky-300" />
                <span className="text-sm font-medium">
                  {communityStats.publicCount} rider{communityStats.publicCount !== 1 ? "s" : ""}{" "}
                  sharing gear
                </span>
              </div>
              {communityStats.totalWithGear > communityStats.publicCount && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <EyeOff className="h-4 w-4 text-white/60" />
                  <span className="text-sm font-medium text-white/60">
                    {communityStats.totalWithGear - communityStats.publicCount} private
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completion & Visibility */}
        <div className="flex items-center gap-4">
          {/* Completion ring */}
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={completionPercent === 100 ? "#22c55e" : "#38bdf8"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${completionPercent * 1.76} 176`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{completionPercent}%</span>
            </div>
          </div>

          {/* Visibility toggle */}
          <button
            onClick={onTogglePublic}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
              isPublic
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-white/10 text-white/70 border border-white/20"
            )}
          >
            {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="text-sm font-medium">{isPublic ? "Public" : "Private"}</span>
          </button>

          {/* Save button */}
          <Button
            onClick={onSave}
            disabled={saving || !hasChanges}
            className={cn(
              "gap-2 shadow-lg",
              hasChanges ? "bg-brand-sky-500 hover:bg-brand-sky-600" : "bg-white/20 hover:bg-white/30"
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {hasChanges ? "Save" : "Saved"}
          </Button>
        </div>
      </div>
    </div>
  );
}
