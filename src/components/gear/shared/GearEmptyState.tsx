"use client";

import { Package, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface GearEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  showLock?: boolean;
}

export function GearEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  showLock = false,
}: GearEmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center py-12 px-6 bg-brand-navy-50 rounded-lg border border-dashed border-brand-navy-200",
        className
      )}
    >
      <Package className="h-10 w-10 text-brand-navy-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-brand-navy-900 mb-2">{title}</h3>
      <p className="text-sm text-brand-navy-600 mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="default"
          className={showLock ? "bg-gradient-to-r from-brand-sky-500 to-brand-sky-600" : ""}
        >
          {showLock ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
