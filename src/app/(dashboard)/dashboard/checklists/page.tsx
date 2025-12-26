"use client";

import Link from "next/link";
import { CheckSquare, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { usePremiumFeature } from "@/hooks/useSubscription";

export default function ChecklistsPage() {
  const { canAccess: isPremium, showUpgrade } = usePremiumFeature("Create Checklist");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
            Packing Checklists
          </h1>
          <p className="mt-2 text-brand-navy-600">
            Never forget race day essentials
          </p>
        </div>
        {isPremium ? (
          <Button asChild>
            <Link href="/dashboard/checklists/new">
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Link>
          </Button>
        ) : (
          <Button
            onClick={showUpgrade}
            className="bg-gradient-to-r from-brand-sky-500 to-brand-sky-600"
          >
            <Lock className="h-4 w-4 mr-2" />
            Upgrade to Create
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-brand-navy-100 mb-4">
          <CheckSquare className="h-8 w-8 text-brand-navy-400" />
        </div>
        <h2 className="text-lg font-medium text-brand-navy-900">
          No checklists yet
        </h2>
        <p className="mt-1 text-brand-navy-600 max-w-sm">
          Create packing checklists for race day, drop bags,
          and crew supplies.
        </p>
        {isPremium ? (
          <Button asChild className="mt-6">
            <Link href="/dashboard/checklists/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Checklist
            </Link>
          </Button>
        ) : (
          <Button
            onClick={showUpgrade}
            className="mt-6 bg-gradient-to-r from-brand-sky-500 to-brand-sky-600"
          >
            <Lock className="h-4 w-4 mr-2" />
            Upgrade to Create
          </Button>
        )}
      </div>
    </div>
  );
}
