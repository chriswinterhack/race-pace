"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bike,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Races", href: "/dashboard/races", icon: Map },
  { label: "Gear", href: "/dashboard/gear", icon: Bike },
  { label: "Profile", href: "/dashboard/settings", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand-navy-200 lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 py-1",
                "transition-colors min-w-[64px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-sky-400",
                isActive
                  ? "text-brand-sky-500"
                  : "text-brand-navy-500 hover:text-brand-navy-700"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
