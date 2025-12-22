"use client";

import Image from "next/image";
import { Bike, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserBike } from "@/types/gear";
import { BIKE_TYPE_LABELS } from "@/types/gear";

interface BikeCardProps {
  bike: UserBike;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

// Generate gradient based on bike type
function getBikeGradient(bikeType: string): string {
  const gradients: Record<string, string> = {
    gravel: "from-amber-600 via-orange-500 to-yellow-600",
    road: "from-blue-600 via-indigo-500 to-purple-600",
    mtb: "from-emerald-600 via-green-500 to-teal-600",
    cx: "from-rose-600 via-red-500 to-orange-600",
  };
  return gradients[bikeType] || "from-brand-navy-700 via-brand-navy-600 to-brand-sky-700";
}

export function BikeCard({
  bike,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: BikeCardProps) {
  const CardWrapper = selectable ? "button" : "div";
  const gradient = getBikeGradient(bike.bike_type);
  const hasImage = !!bike.image_url;

  return (
    <CardWrapper
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "relative w-full text-left rounded-xl border transition-all group",
        selectable && "cursor-pointer",
        selected
          ? "border-brand-sky-500 ring-2 ring-brand-sky-500 shadow-lg"
          : "border-brand-navy-200 bg-white hover:border-brand-navy-300 hover:shadow-md"
      )}
    >
      {/* Header with Photo or Gradient */}
      <div className="relative h-32 overflow-hidden rounded-t-xl">
        {hasImage ? (
          <>
            <Image
              src={bike.image_url!}
              alt={`${bike.brand} ${bike.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-r", gradient)}>
            {/* Pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Selection indicator */}
        {selectable && selected && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-lg z-10">
            <Check className="h-4 w-4 text-brand-sky-500" />
          </div>
        )}

        {/* Actions */}
        {!selectable && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-brand-navy-600"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bike Icon - positioned to overlap image and content */}
      <div className="absolute left-4 top-[108px] z-10">
        <div className="p-3 rounded-xl bg-brand-navy-900 shadow-lg">
          <Bike className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-heading font-bold text-brand-navy-900 text-lg">
              {bike.brand}
            </h4>
            <p className="text-brand-navy-600">{bike.model}</p>
          </div>
          {bike.year && (
            <span className="text-sm font-mono text-brand-navy-500 bg-brand-navy-50 px-2 py-0.5 rounded">
              {bike.year}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            bike.bike_type === "gravel" && "bg-amber-100 text-amber-700",
            bike.bike_type === "road" && "bg-blue-100 text-blue-700",
            bike.bike_type === "mtb" && "bg-emerald-100 text-emerald-700",
            bike.bike_type === "cx" && "bg-rose-100 text-rose-700"
          )}>
            {BIKE_TYPE_LABELS[bike.bike_type]}
          </span>
        </div>

        {bike.notes && (
          <p className="mt-3 text-sm text-brand-navy-500 line-clamp-2">{bike.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
