"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bike,
  Settings,
  Search,
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
  { label: "Search", href: "/dashboard/search", icon: Search },
  { label: "Gear", href: "/dashboard/gear", icon: Bike },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Find active index
  const activeIndex = mobileNavItems.findIndex((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  // Update indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      if (!nav || activeIndex === -1) return;

      const activeButton = nav.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeButton) {
        const navRect = nav.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - navRect.left + buttonRect.width / 2 - 20,
          width: 40,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname, activeIndex]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Mobile navigation"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-brand-navy-900/95 backdrop-blur-xl border-t border-brand-navy-700" />

      {/* Safe area spacer for iOS */}
      <div className="absolute bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-brand-navy-900" />

      <div
        ref={navRef}
        className="relative flex items-center justify-around h-16 px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Animated Indicator Pill */}
        {activeIndex !== -1 && (
          <div
            className="absolute top-2 h-1 bg-gradient-to-r from-brand-sky-400 to-brand-sky-500 rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />
        )}

        {mobileNavItems.map((item, index) => {
          const isActive = index === activeIndex;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-index={index}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full px-2 py-1",
                "transition-all duration-200 min-w-[56px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-sky-400",
                "active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-brand-sky-500/20"
                    : "hover:bg-brand-navy-800"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive
                      ? "text-brand-sky-400 scale-110"
                      : "text-brand-navy-400"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium transition-colors duration-200",
                  isActive ? "text-brand-sky-400" : "text-brand-navy-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
