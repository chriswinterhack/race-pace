"use client";

import { Bell } from "lucide-react";

export function NotificationsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Notifications
        </h2>
        <p className="text-sm text-brand-navy-500">
          Manage how you receive updates
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-navy-100 flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-brand-navy-400" />
          </div>
          <h3 className="font-medium text-brand-navy-900">Coming Soon</h3>
          <p className="text-sm text-brand-navy-500 mt-1 max-w-sm">
            Email and push notification preferences will be available here. For
            now, you&apos;ll receive in-app notifications automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
