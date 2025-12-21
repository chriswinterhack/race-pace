"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [userInitial, setUserInitial] = useState("U");
  const [userName, setUserName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", user.id)
          .single();
        if (data) {
          const name = data.name || data.email || "";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase() || "U");
        }
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b border-brand-navy-200 lg:px-6">
      {/* Mobile logo / Title */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="lg:hidden">
          <span className="text-xl font-heading font-bold text-brand-navy-900">
            Race<span className="text-brand-sky-400">Pace</span>
          </span>
        </Link>
        {title && (
          <h1 className="hidden lg:block text-xl font-heading font-semibold text-brand-navy-900">
            {title}
          </h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-100"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-100 relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-sky-500 rounded-full" />
        </Button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-navy-100 text-brand-navy-600 font-medium text-sm hover:bg-brand-navy-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400"
            aria-label="User menu"
            aria-expanded={showMenu}
          >
            {userInitial}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-brand-navy-200 py-1 z-50">
              {userName && (
                <div className="px-4 py-2 border-b border-brand-navy-100">
                  <p className="text-sm font-medium text-brand-navy-900 truncate">{userName}</p>
                </div>
              )}
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-brand-navy-700 hover:bg-brand-navy-50"
                onClick={() => setShowMenu(false)}
              >
                <User className="h-4 w-4" />
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
