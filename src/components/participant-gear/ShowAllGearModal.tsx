import { Bike, Circle, Footprints, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import type { CommunityStats, ShowAllCategory } from "./types";

interface ShowAllGearModalProps {
  category: ShowAllCategory;
  raceName: string;
  communityStats: CommunityStats | null;
  onClose: () => void;
}

export function ShowAllGearModal({
  category,
  raceName,
  communityStats,
  onClose,
}: ShowAllGearModalProps) {
  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {category === "bikes" && (
              <>
                <Bike className="h-5 w-5 text-brand-sky-500" /> All Bikes for {raceName}
              </>
            )}
            {category === "tires" && (
              <>
                <Circle className="h-5 w-5 text-amber-500" /> All Tires for {raceName}
              </>
            )}
            {category === "shoes" && (
              <>
                <Footprints className="h-5 w-5 text-emerald-500" /> All Shoes for {raceName}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {communityStats && (
          <div className="pt-4">
            {/* All Bikes */}
            {category === "bikes" && communityStats.bikes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-brand-navy-500 mb-4">
                  {communityStats.bikes.reduce((sum, b) => sum + b.count, 0)} total selections from{" "}
                  {communityStats.publicCount} riders
                </p>
                {communityStats.bikes.map((bike, i) => (
                  <div
                    key={`${bike.brand}-${bike.model}-${i}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-sky-50 border border-brand-sky-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-sky-100 flex items-center justify-center">
                        <Bike className="h-5 w-5 text-brand-sky-600" />
                      </div>
                      <span className="font-medium text-brand-navy-900">
                        {bike.brand} {bike.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-sky-200/50">
                        <Users className="h-4 w-4 text-brand-sky-700" />
                        <span className="text-sm font-bold text-brand-sky-700">{bike.count}</span>
                      </div>
                      <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                        {bike.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Tires */}
            {category === "tires" && communityStats.tires.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-brand-navy-500 mb-4">
                  {communityStats.tires.reduce((sum, t) => sum + t.count, 0)} total selections (front +
                  rear)
                </p>
                {communityStats.tires.map((tire, i) => (
                  <div
                    key={`${tire.brand}-${tire.model}-${tire.width || ""}-${i}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Circle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="font-medium text-brand-navy-900">
                          {tire.brand} {tire.model}
                        </span>
                        {tire.width && (
                          <span className="text-brand-navy-500 ml-2">({tire.width})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200/50">
                        <Users className="h-4 w-4 text-amber-700" />
                        <span className="text-sm font-bold text-amber-700">{tire.count}</span>
                      </div>
                      <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                        {tire.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Shoes */}
            {category === "shoes" && communityStats.shoes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-brand-navy-500 mb-4">
                  {communityStats.shoes.reduce((sum, s) => sum + s.count, 0)} total selections from{" "}
                  {communityStats.publicCount} riders
                </p>
                {communityStats.shoes.map((shoe, i) => (
                  <div
                    key={`${shoe.brand}-${shoe.model}-${i}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Footprints className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="font-medium text-brand-navy-900">
                        {shoe.brand} {shoe.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-200/50">
                        <Users className="h-4 w-4 text-emerald-700" />
                        <span className="text-sm font-bold text-emerald-700">{shoe.count}</span>
                      </div>
                      <span className="text-sm font-medium text-brand-navy-500 w-12 text-right">
                        {shoe.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
