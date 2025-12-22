"use client";

import { Wrench, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserRepairKit } from "@/types/gear";

interface RepairKitCardProps {
  kit: UserRepairKit;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

export function RepairKitCard({
  kit,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  selectable = false,
}: RepairKitCardProps) {
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
      <div className="relative h-14 bg-gradient-to-r from-zinc-700 via-slate-600 to-gray-700">
        {/* Tool pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Wrench Icon */}
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <div className="p-2 rounded-lg bg-white shadow-lg border-2 border-white">
            <Wrench className="h-5 w-5 text-zinc-700" />
          </div>
        </div>

        {/* Item count badge */}
        <div className="absolute bottom-2 right-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-zinc-700">
            {kit.items.length} items
          </span>
        </div>

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
        <h4 className="font-heading font-bold text-brand-navy-900">{kit.name}</h4>

        {kit.items.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {kit.items.slice(0, 4).map((item, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full"
              >
                {item}
              </span>
            ))}
            {kit.items.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">
                +{kit.items.length - 4} more
              </span>
            )}
          </div>
        )}

        {kit.notes && (
          <p className="mt-2 text-xs text-brand-navy-500 line-clamp-2">{kit.notes}</p>
        )}
      </div>
    </CardWrapper>
  );
}
