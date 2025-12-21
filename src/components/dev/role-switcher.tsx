"use client";

import { useDevRole } from "@/hooks/use-dev-role";
import { Shield, Users, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roles: { value: UserRole; label: string; icon: typeof Shield }[] = [
  { value: "admin", label: "Admin", icon: Shield },
  { value: "coach", label: "Coach", icon: Users },
  { value: "athlete", label: "Athlete", icon: User },
];

export function DevRoleSwitcher() {
  const { role, setRole } = useDevRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentRole = roles.find((r) => r.value === role) ?? roles[0]!;
  const Icon = currentRole.icon;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div ref={ref} className="fixed bottom-20 left-4 z-[100] lg:bottom-4">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            "bg-amber-100 text-amber-800 border border-amber-300",
            "hover:bg-amber-200 transition-colors",
            "shadow-lg"
          )}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-600">
            Dev
          </span>
          <span className="w-px h-4 bg-amber-300" />
          <Icon className="h-4 w-4" />
          <span>{currentRole.label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-full min-w-[160px] bg-white rounded-lg shadow-xl border border-brand-navy-200 overflow-hidden">
            {roles.map((r) => {
              const RoleIcon = r.icon;
              const isActive = r.value === role;
              return (
                <button
                  key={r.value}
                  onClick={() => {
                    setRole(r.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left",
                    "hover:bg-brand-navy-50 transition-colors",
                    isActive && "bg-brand-sky-50 text-brand-sky-600"
                  )}
                >
                  <RoleIcon className="h-4 w-4" />
                  <span>{r.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs text-brand-sky-500">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
