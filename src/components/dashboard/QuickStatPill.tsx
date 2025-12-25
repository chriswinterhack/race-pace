"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickStatPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  color: "sky" | "amber" | "emerald" | "purple";
  href?: string;
}

const colorClasses = {
  sky: "bg-brand-sky-50 border-brand-sky-200 hover:border-brand-sky-300",
  amber: "bg-amber-50 border-amber-200 hover:border-amber-300",
  emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
  purple: "bg-purple-50 border-purple-200 hover:border-purple-300",
};

const iconColors = {
  sky: "text-brand-sky-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
  purple: "text-purple-500",
};

export function QuickStatPill({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  href,
}: QuickStatPillProps) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
        colorClasses[color],
        href && "cursor-pointer"
      )}
    >
      <Icon className={cn("h-5 w-5", iconColors[color])} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-navy-500 truncate">{label}</p>
        <p className="text-lg font-bold text-brand-navy-900 font-mono tabular-nums">
          {value}
          {suffix && value !== "—" && (
            <span className="text-sm text-brand-navy-400 ml-0.5">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
