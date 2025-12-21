"use client";

import { useState, useEffect } from "react";
import { Mountain, Map, Download, Loader2, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui";
import dynamic from "next/dynamic";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Dynamically import the map component to avoid SSR issues with Leaflet
const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center bg-brand-navy-50 rounded-lg">
      <div className="flex items-center gap-2 text-brand-navy-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading map...
      </div>
    </div>
  ),
});

interface RaceDistance {
  id: string;
  name: string | null;
  distance_miles: number;
  elevation_gain: number | null;
  elevation_loss: number | null;
  elevation_high: number | null;
  elevation_low: number | null;
  gpx_file_url: string | null;
  aid_stations: Array<{ name: string; mile: number; cutoff?: string; type?: "aid_station" | "checkpoint" }> | null;
}

interface RacePlan {
  id: string;
  race_distance: RaceDistance;
}

interface CourseSectionProps {
  plan: RacePlan;
}

export interface ElevationPoint {
  mile: number;
  elevation: number;
  lat: number;
  lon: number;
  gradient: number; // Percentage grade at this point
}

interface CourseStats {
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
}

export function CourseSection({ plan }: CourseSectionProps) {
  const distance = plan.race_distance;
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (distance?.gpx_file_url) {
      fetchAndParseGPX(distance.gpx_file_url);
    }
  }, [distance?.gpx_file_url]);

  async function fetchAndParseGPX(url: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch GPX file");
      }

      const gpxText = await response.text();
      const parser = new DOMParser();
      const gpxDoc = parser.parseFromString(gpxText, "text/xml");

      const trackPoints = gpxDoc.querySelectorAll("trkpt");
      if (trackPoints.length === 0) {
        throw new Error("No track points found in GPX file");
      }

      const points: ElevationPoint[] = [];
      let totalDistance = 0;
      let totalGain = 0;
      let totalLoss = 0;
      let prevLat: number | null = null;
      let prevLon: number | null = null;
      let prevElevation: number | null = null;
      let minElev = Infinity;
      let maxElev = -Infinity;
      let lastSampledElevation: number | null = null;
      let lastSampledMile = 0;

      trackPoints.forEach((point) => {
        const lat = parseFloat(point.getAttribute("lat") || "0");
        const lon = parseFloat(point.getAttribute("lon") || "0");
        const eleElement = point.querySelector("ele");
        const elevation = eleElement ? parseFloat(eleElement.textContent || "0") : 0;

        // Convert elevation from meters to feet
        const elevationFt = elevation * 3.28084;

        // Track min/max elevation
        if (elevationFt < minElev) minElev = elevationFt;
        if (elevationFt > maxElev) maxElev = elevationFt;

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
          // Calculate distance using Haversine formula
          const distanceKm = haversineDistance(prevLat, prevLon, lat, lon);
          totalDistance += distanceKm * 0.621371; // Convert to miles
        }

        // Sample points to avoid too much data (every ~0.1 miles)
        const lastPoint = points[points.length - 1];
        if (points.length === 0 || (lastPoint && totalDistance - lastPoint.mile >= 0.1)) {
          // Calculate gradient (% grade) based on elevation change over distance
          let gradient = 0;
          if (lastSampledElevation !== null && totalDistance > lastSampledMile) {
            const elevChange = elevationFt - lastSampledElevation;
            const distChange = (totalDistance - lastSampledMile) * 5280; // Convert miles to feet
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

      setElevationData(points);
      setCourseStats({
        totalDistance: Math.round(totalDistance * 10) / 10,
        elevationGain: Math.round(totalGain),
        elevationLoss: Math.round(totalLoss),
        minElevation: Math.round(minElev),
        maxElevation: Math.round(maxElev),
      });
    } catch (err) {
      console.error("Error parsing GPX:", err);
      setError(err instanceof Error ? err.message : "Failed to parse GPX file");
    } finally {
      setLoading(false);
    }
  }

  // Haversine formula for distance between two points
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const minElevation = elevationData.length > 0
    ? Math.min(...elevationData.map((d) => d.elevation))
    : 0;
  const maxElevation = elevationData.length > 0
    ? Math.max(...elevationData.map((d) => d.elevation))
    : 0;

  // Use GPX-derived stats if available, otherwise fall back to database values
  const displayStats = {
    distance: courseStats?.totalDistance ?? distance.distance_miles,
    elevationGain: courseStats?.elevationGain ?? distance.elevation_gain,
    elevationLoss: courseStats?.elevationLoss ?? distance.elevation_loss,
    highPoint: courseStats?.maxElevation ?? distance.elevation_high,
    lowPoint: courseStats?.minElevation ?? distance.elevation_low,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy-900">Course Profile</h3>
          <p className="mt-1 text-sm text-brand-navy-600">
            Elevation profile and course map
          </p>
        </div>
        {distance?.gpx_file_url && (
          <Button variant="outline" asChild>
            <a href={distance.gpx_file_url} download className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download GPX
            </a>
          </Button>
        )}
      </div>

      {/* Big Bold Stats */}
      {(courseStats || distance.distance_miles) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Distance */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 p-6 text-white">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Mountain className="h-24 w-24" />
            </div>
            <p className="text-sm font-medium text-brand-navy-200">Distance</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {displayStats.distance}
              <span className="ml-1 text-xl font-normal text-brand-navy-300">mi</span>
            </p>
          </div>

          {/* Elevation Gain */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
            <div className="absolute -right-4 -top-4 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
            <p className="text-sm font-medium text-green-100">Elevation Gain</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {displayStats.elevationGain?.toLocaleString() ?? "—"}
              <span className="ml-1 text-xl font-normal text-green-200">ft</span>
            </p>
          </div>

          {/* Highest Point */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-sky-500 to-brand-sky-600 p-6 text-white">
            <div className="absolute -right-4 -top-4 opacity-10">
              <ArrowUp className="h-24 w-24" />
            </div>
            <p className="text-sm font-medium text-brand-sky-100">Highest Point</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {displayStats.highPoint?.toLocaleString() ?? "—"}
              <span className="ml-1 text-xl font-normal text-brand-sky-200">ft</span>
            </p>
          </div>

          {/* Lowest Point */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white">
            <div className="absolute -right-4 -top-4 opacity-10">
              <ArrowDown className="h-24 w-24" />
            </div>
            <p className="text-sm font-medium text-amber-100">Lowest Point</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {displayStats.lowPoint?.toLocaleString() ?? "—"}
              <span className="ml-1 text-xl font-normal text-amber-200">ft</span>
            </p>
          </div>
        </div>
      )}

      {/* Course Map */}
      <div>
        <h4 className="text-sm font-medium text-brand-navy-700 mb-4 flex items-center gap-2">
          <Map className="h-4 w-4" />
          Course Map
        </h4>

        {loading && (
          <div className="h-80 flex items-center justify-center bg-brand-navy-50 rounded-lg">
            <div className="flex items-center gap-2 text-brand-navy-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading course data...
            </div>
          </div>
        )}

        {!loading && !error && elevationData.length > 0 && (
          <CourseMap
            points={elevationData}
            aidStations={(distance?.aid_stations ?? []).filter(
              (s) => !s.type || s.type === "aid_station"
            )}
          />
        )}

        {!loading && !error && elevationData.length === 0 && !distance?.gpx_file_url && (
          <div className="h-80 flex flex-col items-center justify-center bg-brand-navy-50 rounded-lg border-2 border-dashed border-brand-navy-200">
            <Map className="h-10 w-10 text-brand-navy-300 mb-3" />
            <p className="text-brand-navy-600 mb-1">No GPX file available</p>
            <p className="text-sm text-brand-navy-500">
              Upload a GPX file to see the course map
            </p>
          </div>
        )}
      </div>

      {/* Elevation Profile Chart */}
      <div>
        <h4 className="text-sm font-medium text-brand-navy-700 mb-4 flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Elevation Profile
        </h4>

        {loading && (
          <div className="h-64 flex items-center justify-center bg-brand-navy-50 rounded-lg">
            <div className="flex items-center gap-2 text-brand-navy-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading elevation data...
            </div>
          </div>
        )}

        {error && (
          <div className="h-64 flex items-center justify-center bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && elevationData.length > 0 && (
          <div className="h-64 bg-brand-navy-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={elevationData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="mile"
                  tick={{ fontSize: 12, fill: "#627d98" }}
                  tickFormatter={(value) => `${value} mi`}
                  axisLine={{ stroke: "#bcccdc" }}
                  tickLine={{ stroke: "#bcccdc" }}
                />
                <YAxis
                  domain={[minElevation - 100, maxElevation + 100]}
                  tick={{ fontSize: 12, fill: "#627d98" }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                  axisLine={{ stroke: "#bcccdc" }}
                  tickLine={{ stroke: "#bcccdc" }}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ElevationPoint;
                      const gradientColor = data.gradient > 0
                        ? "text-green-600"
                        : data.gradient < 0
                          ? "text-red-600"
                          : "text-brand-navy-600";
                      const gradientLabel = data.gradient > 0
                        ? `+${data.gradient}%`
                        : `${data.gradient}%`;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-brand-navy-200">
                          <p className="text-sm font-medium text-brand-navy-900">
                            Mile {data.mile}
                          </p>
                          <p className="text-sm text-brand-navy-600">
                            Elevation: {data.elevation.toLocaleString()} ft
                          </p>
                          <p className={`text-sm font-medium ${gradientColor}`}>
                            Grade: {gradientLabel}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#elevationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && elevationData.length === 0 && !distance?.gpx_file_url && (
          <div className="h-64 flex flex-col items-center justify-center bg-brand-navy-50 rounded-lg">
            <Mountain className="h-10 w-10 text-brand-navy-300 mb-3" />
            <p className="text-brand-navy-600 mb-1">No GPX file available</p>
            <p className="text-sm text-brand-navy-500">
              Elevation profile will appear when GPX data is uploaded
            </p>
          </div>
        )}
      </div>

      {/* Aid Station Markers */}
      {(() => {
        // Filter to only show actual aid stations (not checkpoints)
        const aidStations = (distance?.aid_stations ?? []).filter(
          (s) => !s.type || s.type === "aid_station"
        );
        return aidStations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-brand-navy-700 mb-4">
              Aid Stations on Course
            </h4>
            <div className="flex gap-3 flex-wrap">
              {aidStations.map((station, index) => (
                <div
                  key={index}
                  className="px-3 py-2 rounded-lg bg-brand-sky-50 border border-brand-sky-200 text-sm"
                >
                  <span className="font-medium text-brand-sky-700">{station.name}</span>
                  <span className="text-brand-sky-500 ml-2">Mile {station.mile}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
