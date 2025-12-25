"use client";

import { useState } from "react";
import { Printer, Download, Loader2, FileText, Maximize, Minimize, Square, Mountain } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { TopTubeStickerPDF, type StickerCheckpoint, type ElevationDataPoint } from "./TopTubeStickerPDF";
import { cn, haversineDistance } from "@/lib/utils";

interface Segment {
  id: string;
  start_mile: number;
  end_mile: number;
  start_name: string | null;
  end_name: string | null;
  target_time_minutes: number;
  elevation_gain?: number | null;
}

interface TopTubeStickerButtonProps {
  raceName: string;
  goalTime?: string;
  segments: Segment[];
  startTime: string;
  totalDistance: number;
  totalElevationGain: number;
  gpxFileUrl?: string | null;
  className?: string;
}

type StickerSize = "standard" | "compact" | "extended";

const SIZE_OPTIONS: { value: StickerSize; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "compact", label: "Compact", description: '2" × 7"', icon: <Minimize className="h-4 w-4" /> },
  { value: "standard", label: "Standard", description: '2.25" × 9"', icon: <Square className="h-4 w-4" /> },
  { value: "extended", label: "Extended", description: '2.5" × 11"', icon: <Maximize className="h-4 w-4" /> },
];

function calculateArrivalTime(startTime: string, elapsedMinutes: number): string {
  const parts = startTime.split(":").map(Number);
  const startHour = parts[0] ?? 6;
  const startMinute = parts[1] ?? 0;
  const totalMinutes = startHour * 60 + startMinute + elapsedMinutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

interface GpxData {
  points: ElevationDataPoint[];
  totalElevationGain: number;
}

// Parse GPX to extract elevation points and calculate total elevation gain
async function fetchElevationData(gpxUrl: string): Promise<GpxData> {
  try {
    const response = await fetch(gpxUrl);
    if (!response.ok) throw new Error("Failed to fetch GPX");

    const gpxText = await response.text();
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, "text/xml");
    const trackPoints = gpxDoc.querySelectorAll("trkpt");

    const points: ElevationDataPoint[] = [];
    let totalDistance = 0;
    let totalElevationGain = 0;
    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let prevElevation: number | null = null;

    trackPoints.forEach((point) => {
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");
      const eleElement = point.querySelector("ele");
      const elevation = eleElement ? parseFloat(eleElement.textContent || "0") : 0;
      const elevationFt = elevation * 3.28084;

      if (prevLat !== null && prevLon !== null) {
        const distanceKm = haversineDistance(prevLat, prevLon, lat, lon);
        totalDistance += distanceKm * 0.621371;
      }

      // Calculate elevation gain
      if (prevElevation !== null && elevationFt > prevElevation) {
        totalElevationGain += elevationFt - prevElevation;
      }

      const lastPoint = points[points.length - 1];
      // Sample every 0.5 miles for a smaller dataset
      if (points.length === 0 || (lastPoint && totalDistance - lastPoint.mile >= 0.5)) {
        points.push({
          mile: Math.round(totalDistance * 10) / 10,
          elevation: Math.round(elevationFt),
        });
      }

      prevLat = lat;
      prevLon = lon;
      prevElevation = elevationFt;
    });

    return { points, totalElevationGain: Math.round(totalElevationGain) };
  } catch (error) {
    console.warn("Could not fetch elevation data:", error);
    return { points: [], totalElevationGain: 0 };
  }
}

export function TopTubeStickerButton({
  raceName,
  goalTime,
  segments,
  startTime,
  totalDistance,
  totalElevationGain,
  gpxFileUrl,
  className,
}: TopTubeStickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<StickerSize>("standard");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // Fetch elevation data and calculate gain from GPX
      let elevationData: ElevationDataPoint[] = [];
      let gpxElevationGain = totalElevationGain; // Fallback to passed value
      if (gpxFileUrl) {
        const gpxData = await fetchElevationData(gpxFileUrl);
        elevationData = gpxData.points;
        if (gpxData.totalElevationGain > 0) {
          gpxElevationGain = gpxData.totalElevationGain;
        }
      }

      // Convert segments to checkpoints with arrival times
      let elapsedMinutes = 0;
      const checkpoints: StickerCheckpoint[] = segments.map((segment, index) => {
        elapsedMinutes += segment.target_time_minutes;
        const isLast = index === segments.length - 1;
        return {
          name: segment.end_name || `Mile ${segment.end_mile}`,
          mile: segment.end_mile,
          arrivalTime: calculateArrivalTime(startTime, elapsedMinutes),
          type: isLast ? "finish" : "aid_station",
        };
      });

      // Generate PDF
      const doc = (
        <TopTubeStickerPDF
          raceName={raceName}
          goalTime={goalTime}
          totalDistance={totalDistance}
          totalElevationGain={gpxElevationGain}
          checkpoints={checkpoints}
          elevationData={elevationData}
          size={size}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `${raceName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-sticker.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate sticker:", error);
    }

    setGenerating(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
        disabled={segments.length === 0}
      >
        <Printer className="h-4 w-4" />
        Top Tube Sticker
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-sky-500" />
              Generate Top Tube Sticker
            </DialogTitle>
            <DialogDescription>
              Create a vertical sticker with your race splits to attach to your bike&apos;s top tube.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Race Info Preview */}
            <div className="p-4 bg-brand-navy-50 rounded-xl space-y-2">
              <h4 className="font-semibold text-brand-navy-900">{raceName}</h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-brand-navy-500 flex items-center gap-1">
                  <Mountain className="h-3 w-3" />
                  {totalDistance.toFixed(1)} mi
                </span>
                <span className="text-brand-navy-500">
                  +{totalElevationGain.toLocaleString()} ft
                </span>
                <span className="text-brand-navy-500">
                  {segments.length} splits
                </span>
              </div>
              {goalTime && (
                <p className="text-sm text-brand-sky-600 font-medium">
                  Goal: {goalTime}
                </p>
              )}
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-brand-navy-700">Sticker Size</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSize(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      size === option.value
                        ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                        : "border-brand-navy-200 hover:border-brand-navy-300 text-brand-navy-600"
                    )}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Preview - Scaled down */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "bg-white border-2 border-brand-navy-200 rounded shadow-sm",
                  "flex flex-col items-center justify-center text-brand-navy-400 text-xs",
                  size === "compact" && "w-8 h-28",
                  size === "standard" && "w-9 h-36",
                  size === "extended" && "w-10 h-40"
                )}
              >
                <span className="text-[8px] writing-vertical-rl rotate-180 text-center">
                  {size}
                </span>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-brand-navy-500">
              Print at 100% scale on waterproof label paper. Apply clear tape for protection.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
