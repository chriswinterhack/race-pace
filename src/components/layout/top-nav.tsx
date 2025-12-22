"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bike,
  Users,
  LogOut,
  Bell,
  Search,
  User,
  Shield,
  FlagTriangleRight,
  UserCog,
  Mountain,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDevRole } from "@/hooks/use-dev-role";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "coach" | "athlete")[];
  category?: "main" | "coach" | "admin";
}

const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "main" },
  { label: "Races", href: "/dashboard/races", icon: Map, category: "main" },
  { label: "Gear", href: "/dashboard/gear", icon: Bike, roles: ["athlete", "coach"], category: "main" },
  { label: "Community", href: "/dashboard/community", icon: Users, category: "main" },
  { label: "Athletes", href: "/dashboard/athletes", icon: Users, roles: ["coach"], category: "coach" },
  { label: "Race Mgmt", href: "/admin/races", icon: FlagTriangleRight, roles: ["admin"], category: "admin" },
  { label: "Users", href: "/admin/users", icon: UserCog, roles: ["admin"], category: "admin" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAdmin, isCoach } = useDevRole();
  const supabase = createClient();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Set mounted after hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter nav items by role - only after mounted to prevent hydration mismatch
  const mainNavItems = mounted
    ? allNavItems.filter(
        (item) => item.category === "main" && (!item.roles || item.roles.includes(role))
      )
    : allNavItems.filter((item) => item.category === "main" && !item.roles);
  const coachNavItems = mounted && isCoach
    ? allNavItems.filter((item) => item.category === "coach")
    : [];
  const adminNavItems = mounted && isAdmin
    ? allNavItems.filter((item) => item.category === "admin")
    : [];

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("name, email, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) {
          const name = data.name || data.email || "";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase() || "U");
          setAvatarUrl(data.avatar_url);
        }
      }
    }
    fetchUser();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update indicator position - only depends on pathname, role determines which items show
  useEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      if (!nav) return;

      // Find active link by querying the DOM directly
      const links = nav.querySelectorAll("[data-nav]");
      let foundLink: HTMLElement | null = null;

      for (const link of links) {
        const href = link.getAttribute("data-nav");
        if (href) {
          const isActive = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(`${href}/`);
          if (isActive) {
            foundLink = link as HTMLElement;
            break;
          }
        }
      }

      if (foundLink) {
        const navRect = nav.getBoundingClientRect();
        const linkRect = foundLink.getBoundingClientRect();
        setIndicatorStyle({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle({ left: 0, width: 0, opacity: 0 });
      }
    };

    // Small delay to ensure DOM is ready after hydration
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isLinkActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const isAdminActive = adminNavItems.some((item) => isLinkActive(item.href));

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main Nav Bar */}
      <div className="bg-brand-navy-900 border-b border-brand-navy-800">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <Mountain className="h-7 w-7 text-brand-sky-400 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-brand-sky-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-heading font-bold text-white tracking-tight">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              ref={navRef}
              className="hidden lg:flex items-center gap-1 relative z-10"
              aria-label="Main navigation"
            >
              {/* Animated Indicator - positioned behind links with negative z-index */}
              <div
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-brand-sky-400 to-brand-sky-500 rounded-full transition-all duration-300 ease-out -z-10 pointer-events-none"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  opacity: indicatorStyle.opacity,
                }}
              />

              {/* Main Nav Items */}
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isLinkActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-nav={item.href}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-white"
                        : "text-brand-navy-300 hover:text-white hover:bg-brand-navy-800/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-brand-sky-400" : ""
                    )} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Coach Separator & Items */}
              {coachNavItems.length > 0 && (
                <>
                  <div className="w-px h-6 bg-brand-navy-700 mx-2" />
                  {coachNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isLinkActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-nav={item.href}
                        className={cn(
                          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                          isActive
                            ? "text-white"
                            : "text-brand-navy-300 hover:text-white hover:bg-brand-navy-800/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-brand-sky-400" : ""
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Admin Dropdown */}
              {adminNavItems.length > 0 && (
                <>
                  <div className="w-px h-6 bg-brand-navy-700 mx-2" />
                  <div className="relative" ref={adminMenuRef}>
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        isAdminActive
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-amber-400/70 hover:text-amber-400 hover:bg-brand-navy-800/50"
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        showAdminMenu && "rotate-180"
                      )} />
                    </button>

                    {/* Admin Dropdown Menu */}
                    {showAdminMenu && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-brand-navy-800 rounded-xl shadow-xl border border-brand-navy-700 py-2 animate-fade-in-scale">
                        {adminNavItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = isLinkActive(item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setShowAdminMenu(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                isActive
                                  ? "text-amber-400 bg-amber-500/10"
                                  : "text-brand-navy-200 hover:text-white hover:bg-brand-navy-700"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="text-brand-navy-300 hover:text-white hover:bg-brand-navy-800 h-9 w-9"
                aria-label="Search"
              >
                <Search className="h-4.5 w-4.5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="text-brand-navy-300 hover:text-white hover:bg-brand-navy-800 relative h-9 w-9"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-sky-400 rounded-full ring-2 ring-brand-navy-900" />
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-brand-navy-700 mx-2" />

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all duration-200",
                    "hover:bg-brand-navy-800 group",
                    showUserMenu && "bg-brand-navy-800"
                  )}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden ring-2 ring-brand-navy-700 group-hover:ring-brand-navy-600 transition-all">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-brand-navy-400 transition-transform duration-200",
                    showUserMenu && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-brand-navy-800 rounded-xl shadow-xl border border-brand-navy-700 overflow-hidden animate-fade-in-scale">
                    {/* User Info */}
                    <div className="px-4 py-3 bg-gradient-to-r from-brand-navy-700/50 to-transparent border-b border-brand-navy-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Profile"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            userInitial
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
                          <p className="text-xs text-brand-navy-400 capitalize">{role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy-200 hover:text-white hover:bg-brand-navy-700 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile & Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
