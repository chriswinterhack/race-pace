"use client";

import {
  User,
  Zap,
  Droplets,
  Settings2,
  Shield,
  Bell,
  Link2,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsSection, NavItem } from "@/types/settings";

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "Profile", icon: User, description: "Name, photo, email" },
  { id: "athlete", label: "Athlete Profile", icon: Zap, description: "FTP, weight, power zones" },
  { id: "nutrition", label: "Nutrition", icon: Droplets, description: "Hourly fueling targets" },
  { id: "preferences", label: "Preferences", icon: Settings2, description: "Units, visibility" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Subscription & payments" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email & push settings" },
  { id: "integrations", label: "Integrations", icon: Link2, description: "Connected apps" },
  { id: "account", label: "Account", icon: Shield, description: "Security, logout" },
];

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsNav({ activeSection, onSectionChange }: SettingsNavProps) {
  return (
    <nav className="lg:w-64 flex-shrink-0">
      <div className="lg:sticky lg:top-24 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isActive
                  ? "bg-brand-sky-50 text-brand-sky-700"
                  : "text-brand-navy-600 hover:bg-brand-navy-50 hover:text-brand-navy-900"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-brand-sky-500" : "text-brand-navy-400"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isActive && "text-brand-sky-700")}>
                  {item.label}
                </p>
                <p className="text-xs text-brand-navy-400 truncate">
                  {item.description}
                </p>
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform",
                  isActive ? "text-brand-sky-400 rotate-90" : "text-brand-navy-300"
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { NAV_ITEMS };
