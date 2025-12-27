"use client";

import type { SurfaceComposition } from "@/types/race-detail";

interface SurfaceBarProps {
  surface: SurfaceComposition;
}

export function SurfaceBar({ surface }: SurfaceBarProps) {
  return (
    <div className="mt-4">
      <div className="flex h-3 rounded-full overflow-hidden bg-brand-navy-100">
        {surface.gravel && surface.gravel > 0 && (
          <div
            className="bg-amber-500"
            style={{ width: `${surface.gravel}%` }}
            title={`${surface.gravel}% Gravel`}
          />
        )}
        {surface.dirt && surface.dirt > 0 && (
          <div
            className="bg-orange-600"
            style={{ width: `${surface.dirt}%` }}
            title={`${surface.dirt}% Dirt`}
          />
        )}
        {surface.singletrack && surface.singletrack > 0 && (
          <div
            className="bg-emerald-500"
            style={{ width: `${surface.singletrack}%` }}
            title={`${surface.singletrack}% Singletrack`}
          />
        )}
        {surface.doubletrack && surface.doubletrack > 0 && (
          <div
            className="bg-lime-500"
            style={{ width: `${surface.doubletrack}%` }}
            title={`${surface.doubletrack}% Doubletrack`}
          />
        )}
        {surface.pavement && surface.pavement > 0 && (
          <div
            className="bg-slate-400"
            style={{ width: `${surface.pavement}%` }}
            title={`${surface.pavement}% Pavement`}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {surface.gravel && surface.gravel > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {surface.gravel}% Gravel
          </span>
        )}
        {surface.dirt && surface.dirt > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            {surface.dirt}% Dirt
          </span>
        )}
        {surface.singletrack && surface.singletrack > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {surface.singletrack}% Singletrack
          </span>
        )}
        {surface.doubletrack && surface.doubletrack > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-lime-500" />
            {surface.doubletrack}% Doubletrack
          </span>
        )}
        {surface.pavement && surface.pavement > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {surface.pavement}% Pavement
          </span>
        )}
      </div>
    </div>
  );
}
