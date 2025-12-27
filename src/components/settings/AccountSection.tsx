"use client";

import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui";

interface AccountSectionProps {
  handleLogout: () => Promise<void>;
}

export function AccountSection({ handleLogout }: AccountSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">Account</h2>
        <p className="text-sm text-brand-navy-500">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-brand-navy-900">Sign Out</h3>
            <p className="text-sm text-brand-navy-500 mt-0.5">
              Sign out of FinalClimb on this device
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <h3 className="font-medium text-red-700 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Danger Zone
          </h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-brand-navy-900">Delete Account</h4>
            <p className="text-sm text-brand-navy-500 mt-0.5">
              Permanently delete your account and all data
            </p>
          </div>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}
