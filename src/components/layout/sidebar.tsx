"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bike,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  FlagTriangleRight,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDevRole } from "@/hooks/use-dev-role";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "coach" | "athlete")[];
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse Races", href: "/dashboard/races", icon: Map },
  { label: "My Gear", href: "/dashboard/gear", icon: Bike, roles: ["athlete", "coach"] },
  { label: "Community", href: "/dashboard/community", icon: Users },
];

const coachNavItems: NavItem[] = [
  { label: "My Athletes", href: "/dashboard/athletes", icon: Users, roles: ["coach"] },
];

const adminNavItems: NavItem[] = [
  { label: "Race Management", href: "/admin/races", icon: FlagTriangleRight, roles: ["admin"] },
  { label: "User Management", href: "/admin/users", icon: UserCog, roles: ["admin"] },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role, isAdmin, isCoach } = useDevRole();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(role));

  const visibleMainNav = filterByRole(mainNavItems);
  const visibleCoachNav = isCoach ? filterByRole(coachNavItems) : [];
  const visibleAdminNav = isAdmin ? filterByRole(adminNavItems) : [];

  const renderNavItem = (item: NavItem) => {
    // For Dashboard, only exact match. For others, also match child routes.
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400",
          isActive
            ? "bg-brand-sky-500/20 text-brand-sky-400"
            : "text-brand-navy-300 hover:bg-brand-navy-800 hover:text-white"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-brand-navy-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-brand-navy-700">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-heading font-bold">
              Race<span className="text-brand-sky-400">Pace</span>
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-brand-navy-300 hover:text-white hover:bg-brand-navy-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {visibleMainNav.map(renderNavItem)}

        {/* Coach Section */}
        {visibleCoachNav.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs font-semibold text-brand-navy-500 uppercase tracking-wider">
                  Coach
                </span>
              </div>
            )}
            {visibleCoachNav.map(renderNavItem)}
          </>
        )}

        {/* Admin Section */}
        {visibleAdminNav.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs font-semibold text-brand-navy-500 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              </div>
            )}
            {visibleAdminNav.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-4 border-t border-brand-navy-700 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400",
                isActive
                  ? "bg-brand-sky-500/20 text-brand-sky-400"
                  : "text-brand-navy-300 hover:bg-brand-navy-800 hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
            "text-brand-navy-300 hover:bg-brand-navy-800 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400"
          )}
          onClick={() => {
            // TODO: Implement logout
          }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
