import { Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GearSlotCardProps } from "./types";

export function GearSlotCard({
  icon: Icon,
  label,
  description,
  isEmpty,
  popularity,
  onAdd,
  onRemove,
  multiSelect,
  compact,
  children,
}: GearSlotCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white overflow-hidden transition-all",
        isEmpty
          ? "border-dashed border-brand-navy-300 hover:border-brand-sky-400"
          : "border-brand-navy-200 shadow-sm"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4",
          compact ? "py-3" : "py-4",
          !isEmpty && "border-b border-brand-navy-100"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              isEmpty ? "bg-brand-navy-100" : "bg-gradient-to-br from-brand-sky-100 to-brand-sky-50"
            )}
          >
            <Icon className={cn("h-5 w-5", isEmpty ? "text-brand-navy-400" : "text-brand-sky-600")} />
          </div>
          <div>
            <h4 className="font-semibold text-brand-navy-900">{label}</h4>
            {!compact && <p className="text-xs text-brand-navy-500">{description}</p>}
          </div>
        </div>

        {isEmpty ? (
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {popularity && popularity.count > 1 && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                <Users className="h-3 w-3" />
                {popularity.count} others
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onAdd}>
              {multiSelect ? <Plus className="h-4 w-4" /> : "Change"}
            </Button>
            {!multiSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-brand-navy-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        {isEmpty ? (
          <button
            onClick={onAdd}
            className={cn(
              "w-full flex items-center justify-center rounded-lg border-2 border-dashed border-brand-navy-200 text-brand-navy-400",
              "hover:border-brand-sky-400 hover:text-brand-sky-600 transition-all",
              compact ? "h-16" : "h-20"
            )}
          >
            <span className="text-sm font-medium">Click to add {label.toLowerCase()}</span>
          </button>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
