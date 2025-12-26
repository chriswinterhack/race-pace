"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  className?: string;
  variant?: "default" | "compact" | "icon-only";
  showUpgradeOnClick?: boolean;
}

export function PremiumBadge({
  className,
  variant = "default",
  showUpgradeOnClick = false,
}: PremiumBadgeProps) {
  const { isPremium, isLoading, data } = useSubscription();

  if (isLoading) {
    return null;
  }

  // For non-premium users, optionally show an upgrade prompt
  if (!isPremium && showUpgradeOnClick) {
    return (
      <button
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("show-upgrade-modal", {
              detail: { feature: "Premium Features" },
            })
          );
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-sky-500 to-brand-sky-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:from-brand-sky-600 hover:to-brand-sky-700",
          className
        )}
      >
        <Sparkles className="h-3 w-3" />
        <span>Upgrade</span>
      </button>
    );
  }

  if (!isPremium) {
    return null;
  }

  // Lifetime badge
  if (data?.isLifetime) {
    if (variant === "icon-only") {
      return (
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600",
            className
          )}
          title="Lifetime Member"
        >
          <Crown className="h-3.5 w-3.5 text-white" />
        </div>
      );
    }

    if (variant === "compact") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-xs font-medium text-white",
            className
          )}
        >
          <Crown className="h-3 w-3" />
          Lifetime
        </span>
      );
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm",
          className
        )}
      >
        <Crown className="h-3.5 w-3.5" />
        Lifetime Member
      </span>
    );
  }

  // Regular premium badge
  if (variant === "icon-only") {
    return (
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600",
          className
        )}
        title="Premium Member"
      >
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-sky-400 to-brand-sky-600 px-2 py-0.5 text-xs font-medium text-white",
          className
        )}
      >
        <Sparkles className="h-3 w-3" />
        Pro
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-sky-400 to-brand-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Premium
    </span>
  );
}
