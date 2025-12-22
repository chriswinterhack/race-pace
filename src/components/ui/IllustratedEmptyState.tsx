"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface IllustratedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "races" | "gear" | "community" | "plans";
  className?: string;
}

// Different gradient themes for different contexts
const variants = {
  default: {
    gradient: "from-brand-navy-800 via-brand-navy-700 to-brand-sky-900",
    iconBg: "bg-brand-sky-100",
    iconColor: "text-brand-sky-500",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  races: {
    gradient: "from-amber-600 via-orange-500 to-red-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  gear: {
    gradient: "from-slate-700 via-zinc-600 to-gray-700",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-600",
    pattern: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  community: {
    gradient: "from-emerald-600 via-teal-500 to-cyan-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='24' viewBox='0 0 88 24'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M10 0l-5.5 9h11L10 0zm0 5.07L12.81 9H7.19L10 5.07zM0 18l5.5-9h-11L0 18zm0-5.07L-2.81 9h5.62L0 12.93zM20 6l-5.5 9h11L20 6zm0 5.07L22.81 15H17.19L20 11.07zM30 0l-5.5 9h11L30 0zm0 5.07L32.81 9H27.19L30 5.07z'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  plans: {
    gradient: "from-purple-600 via-violet-500 to-indigo-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
};

export function IllustratedEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className,
}: IllustratedEmptyStateProps) {
  const theme = variants[variant];

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-brand-navy-200", className)}>
      {/* Gradient Background */}
      <div className={cn("h-32 sm:h-40 bg-gradient-to-br relative", theme.gradient)}>
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: theme.pattern }}
        />

        {/* Decorative shapes */}
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

        {/* Icon positioned at bottom center */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className={cn("p-4 rounded-2xl shadow-xl border-4 border-white", theme.iconBg)}>
            <Icon className={cn("h-8 w-8", theme.iconColor)} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 pb-8 px-6 text-center bg-white">
        <h3 className="text-xl font-heading font-bold text-brand-navy-900">
          {title}
        </h3>
        <p className="mt-2 text-brand-navy-600 max-w-sm mx-auto">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-6">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
