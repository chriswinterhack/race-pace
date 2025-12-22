"use client";

import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy-50 via-white to-brand-sky-50/30 overflow-x-hidden">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <main id="main-content" className="pb-20 lg:pb-8">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
