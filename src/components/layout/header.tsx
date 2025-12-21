"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
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
        {/* User avatar placeholder */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-navy-100 text-brand-navy-600 font-medium text-sm hover:bg-brand-navy-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400"
          aria-label="User menu"
        >
          U
        </button>
      </div>
    </header>
  );
}
