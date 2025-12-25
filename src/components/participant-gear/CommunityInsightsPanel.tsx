import { Bike, Circle, Wrench, Sparkles, Footprints } from "lucide-react";
import type { CommunityStats } from "./types";

interface CommunityInsightsPanelProps {
  stats: CommunityStats | null;
  onShowAllBikes?: () => void;
  onShowAllTires?: () => void;
  onShowAllShoes?: () => void;
}

export function CommunityInsightsPanel({
  stats,
  onShowAllBikes,
  onShowAllTires,
  onShowAllShoes,
}: CommunityInsightsPanelProps) {
  if (!stats || stats.publicCount === 0) {
    return (
      <div className="rounded-xl border border-brand-navy-200 bg-gradient-to-b from-brand-navy-50 to-white p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-navy-100 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-brand-navy-400" />
        </div>
        <h4 className="font-semibold text-brand-navy-900">Be a Trailblazer</h4>
        <p className="mt-2 text-sm text-brand-navy-600">
          You&apos;re among the first to share gear for this race. Your setup will help others decide
          what to bring!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-brand-navy-900">Popular Choices</h3>

      {/* Popular Bikes */}
      {stats.bikes.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-brand-sky-50 border-b border-brand-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-brand-sky-600" />
                <h4 className="font-semibold text-brand-sky-900 text-sm">Bikes</h4>
              </div>
              {onShowAllBikes && stats.bikes.length > 3 && (
                <button
                  onClick={onShowAllBikes}
                  className="text-xs font-medium text-brand-sky-600 hover:text-brand-sky-700"
                >
                  Show All ({stats.bikes.length})
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.bikes.slice(0, 3).map((bike, i) => (
              <div key={`${bike.brand}-${bike.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {bike.brand} {bike.model}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {bike.count} rider{bike.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tires */}
      {stats.tires.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-amber-600" />
                <h4 className="font-semibold text-amber-900 text-sm">Tires</h4>
              </div>
              {onShowAllTires && stats.tires.length > 3 && (
                <button
                  onClick={onShowAllTires}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  Show All ({stats.tires.length})
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.tires.slice(0, 3).map((tire, i) => (
              <div key={`${tire.brand}-${tire.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {tire.brand} {tire.model}
                  {tire.width && <span className="text-brand-navy-400 ml-1">({tire.width})</span>}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {tire.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Shoes */}
      {stats.shoes.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900 text-sm">Shoes</h4>
              </div>
              {onShowAllShoes && stats.shoes.length > 3 && (
                <button
                  onClick={onShowAllShoes}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Show All ({stats.shoes.length})
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {stats.shoes.slice(0, 3).map((shoe, i) => (
              <div key={`${shoe.brand}-${shoe.model}-${i}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-navy-800 truncate">
                  {shoe.brand} {shoe.model}
                </span>
                <span className="flex-shrink-0 ml-2 text-xs font-medium text-brand-navy-500">
                  {shoe.count} rider{shoe.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repair Kit Essentials */}
      {stats.repairKitItems.length > 0 && (
        <div className="rounded-xl border border-brand-navy-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-purple-900 text-sm">Repair Essentials</h4>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {stats.repairKitItems.slice(0, 8).map(({ item, count }) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-md"
                >
                  {item}
                  <span className="text-purple-400">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
