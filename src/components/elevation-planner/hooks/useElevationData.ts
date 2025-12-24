"use client";

import { useState, useEffect, useCallback } from "react";
import { useElevationPlannerStore } from "@/stores/elevationPlannerStore";
import { haversineDistance } from "@/lib/utils";
import type { ElevationPoint } from "../types";

// Parse GPX text and extract elevation points
function parseGPX(gpxText: string): {
  points: ElevationPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
} {
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(gpxText, "text/xml");
  const trackPoints = gpxDoc.querySelectorAll("trkpt");

  const points: ElevationPoint[] = [];
  let totalDistance = 0;
  let totalGain = 0;
  let totalLoss = 0;
  let prevLat: number | null = null;
  let prevLon: number | null = null;
  let prevElevation: number | null = null;
  let lastSampledElevation: number | null = null;
  let lastSampledMile = 0;
  let lastValidElevation: number | null = null;

  trackPoints.forEach((point) => {
    const lat = parseFloat(point.getAttribute("lat") || "0");
    const lon = parseFloat(point.getAttribute("lon") || "0");
    const eleElement = point.querySelector("ele");
    const rawElevation = eleElement ? parseFloat(eleElement.textContent || "") : NaN;

    // Handle missing or invalid elevation - use last valid or skip
    let elevation: number;
    const isInvalidElevation = isNaN(rawElevation);

    // Detect sudden dropouts: if elevation suddenly drops more than 500ft in one point
    const rawElevationFt = rawElevation * 3.28084;
    const isSuddenDropout = lastValidElevation !== null &&
      !isInvalidElevation &&
      Math.abs(rawElevationFt - lastValidElevation) > 500;

    if (isInvalidElevation || isSuddenDropout) {
      // If elevation is missing/invalid or looks like a data error, use last valid
      if (lastValidElevation !== null) {
        elevation = lastValidElevation / 3.28084; // Convert back to meters for consistency
      } else {
        // Skip this point entirely if we don't have any valid elevation yet
        prevLat = lat;
        prevLon = lon;
        return;
      }
    } else {
      elevation = rawElevation;
      lastValidElevation = rawElevation * 3.28084;
    }

    const elevationFt = elevation * 3.28084;

    // Calculate elevation gain/loss
    if (prevElevation !== null) {
      const elevDiff = elevationFt - prevElevation;
      if (elevDiff > 0) {
        totalGain += elevDiff;
      } else {
        totalLoss += Math.abs(elevDiff);
      }
    }
    prevElevation = elevationFt;

    if (prevLat !== null && prevLon !== null) {
      const distanceKm = haversineDistance(prevLat, prevLon, lat, lon);
      totalDistance += distanceKm * 0.621371;
    }

    // Sample points approximately every 0.1 miles
    const lastPoint = points[points.length - 1];
    if (points.length === 0 || (lastPoint && totalDistance - lastPoint.mile >= 0.1)) {
      let gradient = 0;
      if (lastSampledElevation !== null && totalDistance > lastSampledMile) {
        const elevChange = elevationFt - lastSampledElevation;
        const distChange = (totalDistance - lastSampledMile) * 5280;
        gradient = (elevChange / distChange) * 100;
      }

      points.push({
        mile: Math.round(totalDistance * 10) / 10,
        elevation: Math.round(elevationFt),
        lat,
        lon,
        gradient: Math.round(gradient * 10) / 10,
      });

      lastSampledElevation = elevationFt;
      lastSampledMile = totalDistance;
    }

    prevLat = lat;
    prevLon = lon;
  });

  return {
    points,
    totalDistance: Math.round(totalDistance * 10) / 10,
    elevationGain: Math.round(totalGain),
    elevationLoss: Math.round(totalLoss),
  };
}

// Cache for parsed GPX data
const gpxCache = new Map<string, {
  points: ElevationPoint[];
  totalDistance: number;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseElevationDataOptions {
  gpxUrl: string | null | undefined;
  autoLoad?: boolean;
}

interface UseElevationDataResult {
  loading: boolean;
  error: string | null;
  points: ElevationPoint[];
  totalDistance: number;
  reload: () => Promise<void>;
}

export function useElevationData({
  gpxUrl,
  autoLoad = true,
}: UseElevationDataOptions): UseElevationDataResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<ElevationPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

  const { setElevationData, setTotalDistance: setStoreDistance } = useElevationPlannerStore();

  const fetchAndParse = useCallback(async () => {
    if (!gpxUrl) {
      setPoints([]);
      setTotalDistance(0);
      return;
    }

    // Check cache first
    const cached = gpxCache.get(gpxUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPoints(cached.points);
      setTotalDistance(cached.totalDistance);
      setElevationData(cached.points);
      setStoreDistance(cached.totalDistance);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(gpxUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch GPX file");
      }

      const gpxText = await response.text();
      const result = parseGPX(gpxText);

      // Cache the result
      gpxCache.set(gpxUrl, {
        points: result.points,
        totalDistance: result.totalDistance,
        timestamp: Date.now(),
      });

      setPoints(result.points);
      setTotalDistance(result.totalDistance);
      setElevationData(result.points);
      setStoreDistance(result.totalDistance);
    } catch (err) {
      console.error("Error parsing GPX:", err);
      setError(err instanceof Error ? err.message : "Failed to parse GPX file");
    } finally {
      setLoading(false);
    }
  }, [gpxUrl, setElevationData, setStoreDistance]);

  useEffect(() => {
    if (autoLoad) {
      fetchAndParse();
    }
  }, [autoLoad, fetchAndParse]);

  return {
    loading,
    error,
    points,
    totalDistance,
    reload: fetchAndParse,
  };
}
