"use client";

import { ReactNode, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "./UpgradeModal";
import { GatedFeature, FEATURE_DISPLAY_NAMES } from "@/lib/stripe/prices";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  feature: GatedFeature;
  children: ReactNode;
  // What to show for free users
  fallback?: ReactNode;
  // If true, shows a blurred/locked version instead of fallback
  showLockedPreview?: boolean;
  // Custom message for the locked preview
  lockedMessage?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showLockedPreview = false,
  lockedMessage,
}: FeatureGateProps) {
  const { isPremium, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Show loading state or skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 rounded-lg bg-brand-navy-100" />
      </div>
    );
  }

  // Premium users get full access
  if (isPremium) {
    return <>{children}</>;
  }

  // Show locked preview with blur
  if (showLockedPreview) {
    return (
      <>
        <div
          className="relative cursor-pointer"
          onClick={() => setShowUpgradeModal(true)}
        >
          {/* Blurred content */}
          <div className="pointer-events-none select-none blur-sm">
            {children}
          </div>

          {/* Overlay with lock icon */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-6 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-sky-100">
                <Lock className="h-6 w-6 text-brand-sky-600" />
              </div>
              <p className="text-center text-sm font-medium text-brand-navy-900">
                {lockedMessage || `${FEATURE_DISPLAY_NAMES[feature]} requires Premium`}
              </p>
              <button className="mt-2 rounded-lg bg-brand-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-sky-600">
                Unlock Now
              </button>
            </div>
          </div>
        </div>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature={feature}
        />
      </>
    );
  }

  // Show custom fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <>
      <div
        className="cursor-pointer rounded-xl border-2 border-dashed border-brand-navy-200 bg-brand-navy-50 p-6 text-center transition-all hover:border-brand-sky-400 hover:bg-brand-sky-50"
        onClick={() => setShowUpgradeModal(true)}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-sky-100">
          <Lock className="h-6 w-6 text-brand-sky-600" />
        </div>
        <h3 className="text-lg font-semibold text-brand-navy-900">
          Premium Feature
        </h3>
        <p className="mt-1 text-sm text-brand-navy-600">
          {FEATURE_DISPLAY_NAMES[feature]} is available with FinalClimb Premium.
        </p>
        <button className="mt-4 rounded-lg bg-brand-sky-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-sky-600">
          Upgrade to Premium
        </button>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={feature}
      />
    </>
  );
}

// HOC for wrapping entire pages/sections
export function withPremiumFeature<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: GatedFeature
) {
  return function PremiumGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature}>
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}
