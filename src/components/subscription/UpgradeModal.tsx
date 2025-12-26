"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Map,
  Watch,
  Download,
  Bike,
  CheckSquare,
  MessageCircle,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";
import { STRIPE_PRICES, FEATURE_DISPLAY_NAMES, GatedFeature } from "@/lib/stripe/prices";

interface UpgradeModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  feature?: GatedFeature;
  triggerFeature?: string;
}

const featureIcons: Record<string, React.ReactNode> = {
  map: <Map className="h-5 w-5" />,
  watch: <Watch className="h-5 w-5" />,
  download: <Download className="h-5 w-5" />,
  bike: <Bike className="h-5 w-5" />,
  checklist: <CheckSquare className="h-5 w-5" />,
  messages: <MessageCircle className="h-5 w-5" />,
};

const benefitsList = [
  { text: "Unlimited race plans with pacing strategies", icon: "map" },
  { text: "Garmin sync for race-day data", icon: "watch" },
  { text: "PDF exports and top tube stickers", icon: "download" },
  { text: "Gear tracking and packing checklists", icon: "checklist" },
];

export function UpgradeModal({
  open: controlledOpen,
  onOpenChange,
  feature,
  triggerFeature,
}: UpgradeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string | undefined>(
    triggerFeature
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Listen for custom events from usePremiumFeature hook
  useEffect(() => {
    const handleShowModal = (event: CustomEvent<{ feature: string }>) => {
      setCurrentFeature(event.detail.feature);
      setInternalOpen(true);
    };

    window.addEventListener(
      "show-upgrade-modal",
      handleShowModal as EventListener
    );

    return () => {
      window.removeEventListener(
        "show-upgrade-modal",
        handleShowModal as EventListener
      );
    };
  }, []);

  // Update feature when props change
  useEffect(() => {
    if (feature) {
      setCurrentFeature(FEATURE_DISPLAY_NAMES[feature] || feature);
    } else if (triggerFeature) {
      setCurrentFeature(triggerFeature);
    }
  }, [feature, triggerFeature]);

  const handleUpgrade = async (priceKey: "annual" | "lifetime") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceKey }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const featureText = currentFeature
    ? `access "${currentFeature}"`
    : "unlock premium features";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl">
            Unlock Your Race Potential
          </DialogTitle>
          <DialogDescription className="text-base">
            You&apos;re trying to {featureText}. This feature is available with
            FinalClimb Premium.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {benefitsList.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-sky-50 text-brand-sky-600">
                {featureIcons[benefit.icon]}
              </div>
              <span className="text-sm text-brand-navy-700">
                {benefit.text}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {/* Annual Plan - Primary */}
          <button
            onClick={() => handleUpgrade("annual")}
            disabled={isLoading}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-sky-500 to-brand-sky-600 p-4 text-left text-white shadow-lg transition-all hover:from-brand-sky-600 hover:to-brand-sky-700 hover:shadow-xl disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Annual Plan</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                    Popular
                  </span>
                </div>
                <div className="mt-1 text-2xl font-bold">
                  ${STRIPE_PRICES.annual.amount / 100}
                  <span className="text-sm font-normal opacity-80">/year</span>
                </div>
              </div>
              <Zap className="h-8 w-8 opacity-80" />
            </div>
          </button>

          {/* Lifetime Plan - Secondary */}
          <button
            onClick={() => handleUpgrade("lifetime")}
            disabled={isLoading}
            className="group w-full rounded-xl border-2 border-brand-navy-200 bg-white p-4 text-left transition-all hover:border-brand-sky-400 hover:bg-brand-sky-50 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-navy-900">
                    Lifetime Access
                  </span>
                  <span className="rounded-full bg-brand-navy-100 px-2 py-0.5 text-xs font-medium text-brand-navy-600">
                    Best Value
                  </span>
                </div>
                <div className="mt-1 text-2xl font-bold text-brand-navy-900">
                  ${STRIPE_PRICES.lifetime.amount / 100}
                  <span className="text-sm font-normal text-brand-navy-500">
                    {" "}
                    one-time
                  </span>
                </div>
              </div>
              <Check className="h-6 w-6 text-brand-navy-400" />
            </div>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-brand-navy-500">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Secure payment via Stripe
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Cancel anytime
          </span>
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full text-brand-navy-500 hover:text-brand-navy-700"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Maybe Later
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Global provider component to show upgrade modal from anywhere
export function UpgradeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <UpgradeModal />
    </>
  );
}
