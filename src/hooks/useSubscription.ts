"use client";

import { useEffect, useCallback, useState } from "react";

export type SubscriptionStatus = "loading" | "free" | "premium";

export interface SubscriptionData {
  isPremium: boolean;
  status: "active" | "inactive" | "past_due" | "canceled";
  expiresAt?: string;
  isLifetime?: boolean;
  subscription?: {
    id: string;
    status: string;
    isLifetime: boolean;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface UseSubscriptionReturn {
  isPremium: boolean;
  isLoading: boolean;
  status: SubscriptionStatus;
  data: SubscriptionData | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/subscription/status");

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in - treat as free
          setStatus("free");
          setData(null);
          return;
        }
        throw new Error("Failed to fetch subscription status");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data);
      setStatus(result.data.isPremium ? "premium" : "free");
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("free"); // Default to free on error
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    isPremium: status === "premium",
    isLoading: status === "loading",
    status,
    data,
    error,
    refresh: fetchSubscription,
  };
}

// Hook for checking if a specific feature is available
export function usePremiumFeature(
  featureName: string
): {
  canAccess: boolean;
  isLoading: boolean;
  showUpgrade: () => void;
} {
  const { isPremium, isLoading } = useSubscription();

  return {
    canAccess: isPremium,
    isLoading,
    showUpgrade: () => {
      // Dispatch a custom event that the modal can listen to
      window.dispatchEvent(
        new CustomEvent("show-upgrade-modal", {
          detail: { feature: featureName },
        })
      );
    },
  };
}
