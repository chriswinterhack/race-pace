"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Bike,
  MapPin,
  TrendingUp,
  Check,
  Bell,
  Loader2,
} from "lucide-react";
import { NotificationEvent } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkRead: () => void;
}

export function NotificationDropdown({
  onClose,
  onMarkRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      const { data } = await res.json();
      setNotifications(data?.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });
      onMarkRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
      onMarkRead();
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "discussion_post":
      case "discussion_reply":
        return MessageSquare;
      case "gear_share":
        return Bike;
      case "new_race":
        return MapPin;
      case "athlete_profile_update":
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "discussion_post":
      case "discussion_reply":
        return "text-blue-400";
      case "gear_share":
        return "text-brand-sky-400";
      case "new_race":
        return "text-emerald-400";
      case "athlete_profile_update":
        return "text-amber-400";
      default:
        return "text-brand-navy-400";
    }
  };

  const getNotificationLink = (notification: NotificationEvent): string => {
    switch (notification.type) {
      case "discussion_post":
      case "discussion_reply":
        if (notification.race?.slug) {
          return `/dashboard/races/${notification.race.slug}?tab=discussions`;
        }
        return "/dashboard/community";
      case "gear_share":
        if (notification.race?.slug) {
          return `/dashboard/races/${notification.race.slug}?tab=gear`;
        }
        return "/dashboard/community/gear";
      case "new_race":
        if (notification.race?.slug) {
          return `/dashboard/races/${notification.race.slug}`;
        }
        return "/dashboard/races";
      case "athlete_profile_update":
        return "/dashboard/athletes";
      default:
        return "/dashboard";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-brand-navy-800 rounded-xl shadow-xl border border-brand-navy-700 overflow-hidden animate-fade-in-scale z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-navy-700 bg-brand-navy-800/80">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="text-xs text-brand-sky-400 hover:text-brand-sky-300 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-sky-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-navy-700 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-brand-navy-500" />
            </div>
            <p className="text-sm text-brand-navy-400">No notifications yet</p>
            <p className="text-xs text-brand-navy-500 mt-1">
              You&apos;ll see activity from your races here
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const iconColor = getIconColor(notification.type);

            return (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                  onClose();
                }}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-brand-navy-700/50 transition-colors border-b border-brand-navy-700/50 last:border-0",
                  !notification.is_read && "bg-brand-sky-500/5"
                )}
              >
                {/* Icon or Avatar */}
                <div className="flex-shrink-0">
                  {notification.actor?.avatar_url ? (
                    <img
                      src={notification.actor.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brand-navy-700 flex items-center justify-center">
                      <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      notification.is_read ? "text-brand-navy-300" : "text-white"
                    )}
                  >
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-brand-navy-400 mt-0.5 line-clamp-1">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-brand-navy-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="flex-shrink-0 self-center">
                    <div className="w-2 h-2 rounded-full bg-brand-sky-400" />
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-brand-navy-700 p-2 bg-brand-navy-800/50">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="block text-center text-sm text-brand-navy-400 hover:text-white py-2 rounded-lg hover:bg-brand-navy-700/50 transition-colors"
          >
            Notification Settings
          </Link>
        </div>
      )}
    </div>
  );
}
