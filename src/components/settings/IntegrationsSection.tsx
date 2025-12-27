"use client";

import { Link2 } from "lucide-react";

export function IntegrationsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Integrations
        </h2>
        <p className="text-sm text-brand-navy-500">
          Connect your favorite apps and devices
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-navy-100 flex items-center justify-center mb-4">
            <Link2 className="h-6 w-6 text-brand-navy-400" />
          </div>
          <h3 className="font-medium text-brand-navy-900">Coming Soon</h3>
          <p className="text-sm text-brand-navy-500 mt-1 max-w-sm">
            Connect with Strava, Garmin, Wahoo, and more to sync your activities
            and power data automatically.
          </p>
          <div className="flex items-center gap-4 mt-6 opacity-50">
            <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">
              Strava
            </div>
            <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">
              Garmin
            </div>
            <div className="px-4 py-2 bg-brand-navy-50 rounded-lg text-sm text-brand-navy-600">
              Wahoo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
