"use client";

import { CheckCircle2, Share2, Eye, EyeOff, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GearSavedPromptProps {
  isPublic: boolean;
  participantCount: number;
  onTogglePublic: () => void;
  onDismiss: () => void;
}

export function GearSavedPrompt({
  isPublic,
  participantCount,
  onTogglePublic,
  onDismiss,
}: GearSavedPromptProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 p-6">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Success icon */}
        <div className="p-3 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>

        <div className="flex-1">
          <h4 className="text-lg font-bold text-emerald-900">Gear Setup Saved!</h4>
          <p className="text-sm text-emerald-700 mt-1">
            Your race setup has been saved. {isPublic ? "Other riders can see your choices." : "Your setup is currently private."}
          </p>

          {/* Visibility toggle */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-emerald-800">Visibility:</span>
              <button
                onClick={onTogglePublic}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                  isPublic
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-white text-emerald-700 border border-emerald-300"
                )}
              >
                {isPublic ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Private
                  </>
                )}
              </button>
            </div>

            {!isPublic && participantCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Users className="h-4 w-4" />
                <span>{participantCount} riders are sharing — join them!</span>
              </div>
            )}

            {isPublic && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Share2 className="h-4 w-4" />
                <span>Helping others decide what to bring</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
