"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnitPreference } from "@/types";

interface UseUnitsResult {
  units: UnitPreference;
  loading: boolean;
}

// Cache the units preference to avoid repeated fetches
let cachedUnits: UnitPreference | null = null;
let cachePromise: Promise<UnitPreference> | null = null;

async function fetchUnitsPreference(): Promise<UnitPreference> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return "imperial"; // Default for non-logged-in users
  }

  const { data: profile } = await supabase
    .from("athlete_profiles")
    .select("preferred_units")
    .eq("user_id", user.id)
    .single();

  return profile?.preferred_units || "imperial";
}

export function useUnits(): UseUnitsResult {
  const [units, setUnits] = useState<UnitPreference>(cachedUnits || "imperial");
  const [loading, setLoading] = useState(!cachedUnits);

  useEffect(() => {
    // If we have a cached value, use it
    if (cachedUnits) {
      setUnits(cachedUnits);
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (cachePromise) {
      cachePromise.then((result) => {
        setUnits(result);
        setLoading(false);
      });
      return;
    }

    // Start a new fetch
    cachePromise = fetchUnitsPreference();
    cachePromise.then((result) => {
      cachedUnits = result;
      setUnits(result);
      setLoading(false);
    }).catch(() => {
      setUnits("imperial");
      setLoading(false);
    });
  }, []);

  return { units, loading };
}

// Function to invalidate cache (call when user changes preference)
export function invalidateUnitsCache(): void {
  cachedUnits = null;
  cachePromise = null;
}

// Function to update cache directly (call when user changes preference)
export function updateUnitsCache(units: UnitPreference): void {
  cachedUnits = units;
}
