"use client";

import { useState, useEffect } from "react";
import { Crown, Loader2, Calendar, Gift, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface CompedSubscription {
  id: string;
  starts_at: string;
  expires_at: string;
  source: string;
  is_active: boolean;
  notes: string | null;
}

interface ManagePremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

type DurationOption = "180" | "365" | "730" | "36500" | "custom";

const DURATION_OPTIONS = [
  { value: "180", label: "6 months", days: 180 },
  { value: "365", label: "1 year", days: 365 },
  { value: "730", label: "2 years", days: 730 },
  { value: "36500", label: "Lifetime", days: 36500 },
  { value: "custom", label: "Custom", days: 0 },
];

export function ManagePremiumModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ManagePremiumModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<CompedSubscription | null>(null);
  const [duration, setDuration] = useState<DurationOption>("365");
  const [customDays, setCustomDays] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch current premium status when modal opens
  useEffect(() => {
    if (open && user) {
      fetchPremiumStatus();
    }
  }, [open, user]);

  const fetchPremiumStatus = async () => {
    if (!user) return;

    setFetchingStatus(true);
    try {
      const response = await fetch(`/api/admin/premium?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setActiveSubscription(data.activeSubscription || null);
      }
    } catch (err) {
      console.error("Error fetching premium status:", err);
    }
    setFetchingStatus(false);
  };

  const handleGrant = async () => {
    if (!user) return;

    const days = duration === "custom" ? parseInt(customDays) : parseInt(duration);
    if (!days || days < 1) {
      toast.error("Please enter a valid number of days");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "grant",
          days,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to grant premium");
        setLoading(false);
        return;
      }

      toast.success(`Premium granted for ${formatDays(days)}`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error granting premium:", err);
      toast.error("Failed to grant premium");
    }
    setLoading(false);
  };

  const handleExtend = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "extend",
          days: 365, // Extend by 1 year
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to extend premium");
        setLoading(false);
        return;
      }

      toast.success("Premium extended by 1 year");
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error extending premium:", err);
      toast.error("Failed to extend premium");
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!user) return;

    if (!confirm("Are you sure you want to revoke this user's premium access?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "revoke",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to revoke premium");
        setLoading(false);
        return;
      }

      toast.success("Premium access revoked");
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error revoking premium:", err);
      toast.error("Failed to revoke premium");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setDuration("365");
    setCustomDays("");
    setNotes("");
    setActiveSubscription(null);
    onOpenChange(false);
  };

  const formatDays = (days: number): string => {
    if (days >= 36500) return "lifetime";
    if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? "s" : ""}`;
    if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""}`;
    return `${days} days`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Manage Premium
          </DialogTitle>
          <DialogDescription>
            {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        {fetchingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-sky-500" />
          </div>
        ) : activeSubscription ? (
          // User has active comped premium
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Premium (Comped)</span>
              </div>
              <div className="space-y-1 text-sm text-amber-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Expires: {formatDate(activeSubscription.expires_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>Source: {activeSubscription.source.replace("_", " ")}</span>
                </div>
                {activeSubscription.notes && (
                  <p className="text-amber-700 mt-2 italic">
                    &ldquo;{activeSubscription.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleExtend}
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                Extend 1 Year
              </Button>
              <Button
                variant="outline"
                onClick={handleRevoke}
                disabled={loading}
                className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Revoke
              </Button>
            </div>
          </div>
        ) : (
          // User has no active comped premium - show grant form
          <div className="space-y-4 py-2">
            <div className="p-4 bg-brand-navy-50 rounded-lg">
              <p className="text-sm text-brand-navy-600">
                This user currently has no comped premium access.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value as DurationOption)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                      duration === option.value
                        ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                        : "border-brand-navy-200 hover:border-brand-navy-300 text-brand-navy-600"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {duration === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customDays">Number of days</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="1"
                    max="36500"
                    placeholder="e.g., 90"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Beta tester reward"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGrant}
                disabled={loading || (duration === "custom" && !customDays)}
                className="flex-1 gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                Grant Premium
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
