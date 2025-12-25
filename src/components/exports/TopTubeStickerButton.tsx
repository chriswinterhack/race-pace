"use client";

import { useState } from "react";
import { Printer, Download, Loader2, FileText, Maximize, Minimize, Square } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { TopTubeStickerPDF, type StickerSegment } from "./TopTubeStickerPDF";
import { cn } from "@/lib/utils";

interface Segment {
  id: string;
  start_mile: number;
  end_mile: number;
  start_name: string | null;
  end_name: string | null;
  target_time_minutes: number;
}

interface TopTubeStickerButtonProps {
  raceName: string;
  raceDate?: string;
  goalTime?: string;
  segments: Segment[];
  startTime: string;
  className?: string;
}

type StickerSize = "standard" | "compact" | "extended";

const SIZE_OPTIONS: { value: StickerSize; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "compact", label: "Compact", description: '1.5" × 6"', icon: <Minimize className="h-4 w-4" /> },
  { value: "standard", label: "Standard", description: '2" × 8"', icon: <Square className="h-4 w-4" /> },
  { value: "extended", label: "Extended", description: '2.5" × 10"', icon: <Maximize className="h-4 w-4" /> },
];

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  }
  return `${mins}m`;
}

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

export function TopTubeStickerButton({
  raceName,
  raceDate,
  goalTime,
  segments,
  startTime,
  className,
}: TopTubeStickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<StickerSize>("standard");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // Convert segments to sticker format
      let elapsedMinutes = 0;
      const stickerSegments: StickerSegment[] = segments.map((segment) => {
        elapsedMinutes += segment.target_time_minutes;
        return {
          name: segment.end_name || `Mile ${segment.end_mile}`,
          mile: segment.end_mile,
          splitTime: formatDuration(segment.target_time_minutes),
          arrivalTime: calculateArrivalTime(startTime, elapsedMinutes),
        };
      });

      // Generate PDF
      const doc = (
        <TopTubeStickerPDF
          raceName={raceName}
          raceDate={raceDate}
          goalTime={goalTime}
          segments={stickerSegments}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-sky-500" />
              Generate Top Tube Sticker
            </DialogTitle>
            <DialogDescription>
              Create a printable sticker with your race splits to attach to your bike&apos;s top tube.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Race Info Preview */}
            <div className="p-4 bg-brand-navy-50 rounded-xl space-y-2">
              <h4 className="font-semibold text-brand-navy-900">{raceName}</h4>
              {raceDate && <p className="text-sm text-brand-navy-600">{raceDate}</p>}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-brand-navy-500">
                  {segments.length} splits
                </span>
                {goalTime && (
                  <span className="text-brand-sky-600 font-medium">
                    Goal: {goalTime}
                  </span>
                )}
              </div>
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

            {/* Info */}
            <div className="text-sm text-brand-navy-500 bg-brand-navy-50 rounded-lg p-3">
              <p className="font-medium text-brand-navy-700 mb-1">Print Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use waterproof label paper for durability</li>
                <li>• Print at 100% scale (no scaling)</li>
                <li>• Apply clear packing tape over the sticker for protection</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
