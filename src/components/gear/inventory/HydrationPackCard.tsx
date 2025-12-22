"use client";

import { Droplets, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserHydrationPack } from "@/types/gear";

interface HydrationPackCardProps {
  pack: UserHydrationPack;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

export function HydrationPackCard({
  pack,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: HydrationPackCardProps) {
  const CardWrapper = selectable ? "button" : "div";

  return (
    <CardWrapper
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "w-full text-left overflow-hidden rounded-xl border transition-all group",
        selectable && "cursor-pointer",
        selected
          ? "border-brand-sky-500 ring-2 ring-brand-sky-500 shadow-lg"
          : "border-brand-navy-200 bg-white hover:border-brand-navy-300 hover:shadow-md"
      )}
    >
      {/* Gradient Header */}
      <div className="relative h-14 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600">
        {/* Wave pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom',
          }}
        />

        {/* Pack Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2 rounded-lg bg-white shadow-lg border-2 border-white">
            <Droplets className="h-5 w-5 text-cyan-600" />
          </div>
        </div>

        {/* Capacity badge */}
        {pack.capacity_liters && (
          <div className="absolute bottom-2 right-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-mono font-bold text-cyan-700">
              {pack.capacity_liters}L
            </span>
          </div>
        )}

        {/* Selection indicator */}
        {selectable && selected && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-lg">
            <Check className="h-4 w-4 text-brand-sky-500" />
          </div>
        )}

        {/* Actions */}
        {!selectable && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-brand-navy-600"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-6 pb-4 px-4">
        <div>
          <h4 className="font-heading font-bold text-brand-navy-900">
            {pack.brand}
          </h4>
          <p className="text-sm text-brand-navy-600">{pack.model}</p>
        </div>

        {pack.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{pack.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
