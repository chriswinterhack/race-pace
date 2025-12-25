"use client";

import { useState } from "react";
import { Bike, Circle, Wrench, Footprints, Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui";
import type { ParticipantGear } from "./types";

interface ParticipantGearCardProps {
  participant: ParticipantGear;
}

export function ParticipantGearCard({ participant }: ParticipantGearCardProps) {
  const [showBikeImage, setShowBikeImage] = useState(false);
  const hasBike = participant.bike !== null;
  const hasTires = participant.frontTire !== null || participant.rearTire !== null;
  const hasShoes = participant.shoes !== null;
  const hasRepairKit = participant.repairKit !== null;

  return (
    <>
      <div className="rounded-xl border border-brand-navy-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-4 py-3 bg-gradient-to-r from-brand-navy-50 to-brand-sky-50 border-b border-brand-navy-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-bold text-sm">
              {participant.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-brand-navy-900">{participant.displayName}</p>
              <p className="text-xs text-brand-navy-500">
                {[hasBike && "Bike", hasTires && "Tires", hasShoes && "Shoes", hasRepairKit && "Repair Kit"]
                  .filter(Boolean)
                  .join(" · ") || "Setup"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {participant.bike && (
            <div className="flex items-start gap-3">
              {participant.bike.imageUrl ? (
                <button
                  onClick={() => setShowBikeImage(true)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-brand-navy-100 group cursor-pointer"
                >
                  <img
                    src={participant.bike.imageUrl}
                    alt={`${participant.bike.brand} ${participant.bike.model}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ) : (
                <div className="p-1.5 rounded-md bg-brand-sky-100">
                  <Bike className="h-4 w-4 text-brand-sky-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-navy-900">
                  {participant.bike.brand} {participant.bike.model}
                </p>
                {participant.bike.year && (
                  <p className="text-xs text-brand-navy-500">{participant.bike.year}</p>
                )}
                {participant.bike.imageUrl && (
                  <button
                    onClick={() => setShowBikeImage(true)}
                    className="text-xs text-brand-sky-600 hover:text-brand-sky-700 mt-0.5"
                  >
                    View photo
                  </button>
                )}
              </div>
            </div>
          )}

          {(participant.frontTire || participant.rearTire) && (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-amber-100">
                <Circle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                {participant.frontTire && (
                  <p className="text-sm font-medium text-brand-navy-900">
                    {participant.frontTire.brand} {participant.frontTire.model}
                    {participant.frontTire.width && (
                      <span className="text-brand-navy-400 ml-1">({participant.frontTire.width})</span>
                    )}
                    {participant.rearTire && participant.frontTire.model !== participant.rearTire.model && (
                      <span className="text-xs text-brand-navy-400 ml-1">F</span>
                    )}
                  </p>
                )}
                {participant.rearTire && participant.rearTire.model !== participant.frontTire?.model && (
                  <p className="text-sm font-medium text-brand-navy-900">
                    {participant.rearTire.brand} {participant.rearTire.model}
                    {participant.rearTire.width && (
                      <span className="text-brand-navy-400 ml-1">({participant.rearTire.width})</span>
                    )}
                    <span className="text-xs text-brand-navy-400 ml-1">R</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {participant.shoes && (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-emerald-100">
                <Footprints className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-navy-900">
                  {participant.shoes.brand} {participant.shoes.model}
                </p>
              </div>
            </div>
          )}

          {participant.repairKit && (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-purple-100">
                <Wrench className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-navy-900">{participant.repairKit.name}</p>
                {participant.repairKit.items.length > 0 && (
                  <p className="text-xs text-brand-navy-500 truncate">
                    {participant.repairKit.items.slice(0, 3).join(", ")}
                    {participant.repairKit.items.length > 3 &&
                      ` +${participant.repairKit.items.length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          )}

          {!hasBike && !hasTires && !hasShoes && !hasRepairKit && (
            <p className="text-sm text-brand-navy-400 italic">No gear details shared</p>
          )}
        </div>
      </div>

      {/* Bike Image Modal */}
      {participant.bike?.imageUrl && (
        <Dialog open={showBikeImage} onOpenChange={setShowBikeImage}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-brand-navy-900 border-brand-navy-700 [&>button]:bg-black/50 [&>button]:text-white [&>button]:border-0 [&>button]:hover:bg-black/70">
            <div className="relative">
              <img
                src={participant.bike.imageUrl}
                alt={`${participant.bike.brand} ${participant.bike.model}`}
                className="w-full h-auto max-h-[70vh] object-contain bg-brand-navy-900"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-lg">
                  {participant.bike.brand} {participant.bike.model}
                </p>
                <p className="text-white/70 text-sm">
                  {participant.displayName}&apos;s race bike
                  {participant.bike.year ? ` • ${participant.bike.year}` : ""}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
