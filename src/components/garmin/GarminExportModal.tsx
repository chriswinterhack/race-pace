"use client";

import { useState } from "react";
import { Watch, Copy, Check, Zap, MapPin, RefreshCw, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/components/ui";
import { toast } from "sonner";

interface Checkpoint {
  name: string;
  mi: number;
  time: string;
  effort: string;
}

interface PowerTargets {
  ftp: number;
  adj: number;
  safe: number;
  tempo: number;
  push: number;
  climbSafe: number;
  climbTempo: number;
  climbPush: number;
  flatSafe: number;
  flatTempo: number;
  flatPush: number;
}

interface SyncCodeData {
  code: string;
  expiresAt: string;
  planData: {
    raceName: string;
    distanceName: string;
    distanceMiles: number;
    goalTimeMinutes: number | null;
    goalTimeFormatted: string | null;
    checkpoints: Checkpoint[];
    power: PowerTargets | null;
    athleteName: string;
    exportedAt: string;
  };
}

interface GarminExportModalProps {
  open: boolean;
  onClose: () => void;
  racePlanId: string;
  isSubscribed: boolean;
}

export function GarminExportModal({
  open,
  onClose,
  racePlanId,
  isSubscribed,
}: GarminExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [syncData, setSyncData] = useState<SyncCodeData | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateSyncCode() {
    setLoading(true);
    try {
      const response = await fetch("/api/garmin/sync-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ race_plan_id: racePlanId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate sync code");
      }

      setSyncData(result.data);
    } catch (error) {
      console.error("Error generating sync code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate sync code");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!syncData?.code) return;
    navigator.clipboard.writeText(syncData.code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setSyncData(null);
    setCopied(false);
    onClose();
  }

  // Format expiration date
  const expiresFormatted = syncData?.expiresAt
    ? new Date(syncData.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-brand-sky-500" />
            Sync to Garmin
          </DialogTitle>
          <DialogDescription>
            View your race plan on your Garmin device
          </DialogDescription>
        </DialogHeader>

        {!isSubscribed ? (
          // Non-subscriber view
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-navy-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-brand-navy-400" />
            </div>
            <h3 className="text-lg font-semibold text-brand-navy-900 mb-2">
              Premium Feature
            </h3>
            <p className="text-brand-navy-600 mb-6">
              Garmin sync is available for subscribers. Get your race plan checkpoints
              and power targets right on your bike computer.
            </p>
            <Button asChild>
              <a href="/dashboard/settings">Upgrade to Premium</a>
            </Button>
          </div>
        ) : !syncData ? (
          // Initial state - generate code
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-sky-100 to-brand-navy-100 flex items-center justify-center">
                <Watch className="h-8 w-8 text-brand-sky-600" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy-900 mb-2">
                Generate Sync Code
              </h3>
              <p className="text-brand-navy-600 text-sm">
                Create a code to sync your race plan to the FinalClimb Connect IQ app
                on your Garmin device.
              </p>
            </div>

            <div className="bg-brand-navy-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-brand-navy-900 mb-2 text-sm">
                What gets synced:
              </h4>
              <ul className="space-y-1.5 text-sm text-brand-navy-600">
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-brand-sky-500" />
                  Checkpoint names and target times
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Power targets (Safe, Tempo, Pushing)
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                  Climb and flat power zones
                </li>
              </ul>
            </div>

            <Button
              onClick={generateSyncCode}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Watch className="h-4 w-4 mr-2" />
                  Generate Sync Code
                </>
              )}
            </Button>
          </div>
        ) : (
          // Code generated - show instructions
          <div className="py-6">
            {/* Sync Code Display */}
            <div className="bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-xl p-6 text-center mb-6">
              <p className="text-brand-navy-400 text-xs uppercase tracking-wider mb-2">
                Your Sync Code
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-white tracking-widest">
                  {syncData.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Copy className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              <p className="text-brand-navy-400 text-xs mt-3">
                Expires {expiresFormatted}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-brand-navy-900">
                How to sync:
              </h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-sky-100 text-brand-sky-600 flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <span className="text-sm text-brand-navy-700">
                    Download <strong>FinalClimb</strong> from the Garmin Connect IQ Store
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-sky-100 text-brand-sky-600 flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <span className="text-sm text-brand-navy-700">
                    Open the app on your Garmin and select &quot;Enter Sync Code&quot;
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-sky-100 text-brand-sky-600 flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <span className="text-sm text-brand-navy-700">
                    Enter the code above to download your race plan
                  </span>
                </li>
              </ol>
            </div>

            {/* Preview of synced data */}
            <div className="bg-brand-navy-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                  Syncing
                </span>
                <span className="text-xs text-brand-navy-500">
                  {syncData.planData.checkpoints.length} checkpoints
                </span>
              </div>
              <p className="font-medium text-brand-navy-900 text-sm">
                {syncData.planData.raceName}
              </p>
              {syncData.planData.power && (
                <div className="mt-2 flex gap-4 text-xs">
                  <span className="text-brand-navy-600">
                    Safe: <span className="font-mono font-medium">{syncData.planData.power.safe}w</span>
                  </span>
                  <span className="text-brand-navy-600">
                    Tempo: <span className="font-mono font-medium">{syncData.planData.power.tempo}w</span>
                  </span>
                  <span className="text-brand-navy-600">
                    Push: <span className="font-mono font-medium">{syncData.planData.power.push}w</span>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Done
              </Button>
              <Button onClick={generateSyncCode} disabled={loading} variant="outline" className="flex-1">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                New Code
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
