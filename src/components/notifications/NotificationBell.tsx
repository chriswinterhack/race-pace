"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, refetch } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-brand-navy-300 hover:text-white hover:bg-brand-navy-800 relative h-9 w-9"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold ring-2 ring-brand-navy-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onMarkRead={refetch}
        />
      )}
    </div>
  );
}
