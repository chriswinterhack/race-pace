"use client";

import {
  User,
  Loader2,
  Check,
  Crown,
  Sparkles,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SubscriptionData } from "@/types/settings";

interface BillingSectionProps {
  subscription: SubscriptionData | null;
  billingLoading: boolean;
  openBillingPortal: () => Promise<void>;
  handleUpgrade: () => Promise<void>;
}

export function BillingSection({
  subscription,
  billingLoading,
  openBillingPortal,
  handleUpgrade,
}: BillingSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy-900">
          Billing & Subscription
        </h2>
        <p className="text-sm text-brand-navy-500">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan Card */}
      <div
        className={cn(
          "rounded-xl border p-6",
          subscription?.isPremium
            ? "bg-gradient-to-br from-brand-sky-50 to-white border-brand-sky-200"
            : "bg-white border-brand-navy-200"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {subscription?.isPremium ? (
                subscription.isLifetime ? (
                  <Crown className="h-5 w-5 text-amber-500" />
                ) : (
                  <Sparkles className="h-5 w-5 text-brand-sky-500" />
                )
              ) : (
                <User className="h-5 w-5 text-brand-navy-400" />
              )}
              <h3 className="font-semibold text-brand-navy-900">
                {subscription?.isPremium
                  ? subscription.isLifetime
                    ? "Lifetime Member"
                    : "Premium"
                  : "Free Plan"}
              </h3>
              {subscription?.isPremium && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    subscription.isLifetime
                      ? "bg-amber-100 text-amber-700"
                      : "bg-brand-sky-100 text-brand-sky-700"
                  )}
                >
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-brand-navy-600">
              {subscription?.isPremium
                ? subscription.isLifetime
                  ? "You have lifetime access to all premium features."
                  : subscription.cancelAtPeriodEnd
                    ? "Your subscription will end on " +
                      (subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : "renewal date")
                    : "Full access to all features. Renews " +
                      (subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : "annually")
                : "Upgrade to unlock race plans, Garmin sync, exports, and more."}
            </p>
          </div>
          {subscription?.isPremium && !subscription.isLifetime && (
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-navy-900">$29</div>
              <div className="text-sm text-brand-navy-500">/year</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {subscription?.isPremium ? (
            !subscription.isLifetime && (
              <Button
                onClick={openBillingPortal}
                disabled={billingLoading}
                variant="outline"
                className="gap-2"
              >
                {billingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={billingLoading}
              className="gap-2 bg-brand-sky-500 hover:bg-brand-sky-600"
            >
              {billingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* Premium Features List */}
      {!subscription?.isPremium && (
        <div className="bg-white rounded-xl border border-brand-navy-200 p-6">
          <h3 className="font-semibold text-brand-navy-900 mb-4">
            What you get with Premium
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: "map", text: "Unlimited race plans" },
              { icon: "watch", text: "Garmin sync" },
              { icon: "download", text: "PDF exports & stickers" },
              { icon: "bike", text: "Gear tracking" },
              { icon: "checklist", text: "Packing checklists" },
              { icon: "messages", text: "Discussion posts" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-brand-navy-600"
              >
                <Check className="h-4 w-4 text-brand-sky-500 flex-shrink-0" />
                {feature.text}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-navy-100 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-brand-navy-900">$29</span>
              <span className="text-brand-navy-500">/year</span>
              <span className="ml-2 text-sm text-brand-navy-400">
                or $79 lifetime
              </span>
            </div>
            <a
              href="/pricing"
              className="text-sm text-brand-sky-600 hover:text-brand-sky-700 font-medium"
            >
              View pricing details →
            </a>
          </div>
        </div>
      )}

      {/* Payment History Link */}
      {subscription?.isPremium && !subscription.isLifetime && (
        <div className="bg-white rounded-xl border border-brand-navy-200 divide-y divide-brand-navy-100">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-brand-navy-900">
                Payment History & Invoices
              </h3>
              <p className="text-sm text-brand-navy-500 mt-0.5">
                View and download past invoices
              </p>
            </div>
            <Button
              variant="outline"
              onClick={openBillingPortal}
              disabled={billingLoading}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Invoices
            </Button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-brand-navy-900">Payment Method</h3>
              <p className="text-sm text-brand-navy-500 mt-0.5">
                Update your card or payment details
              </p>
            </div>
            <Button
              variant="outline"
              onClick={openBillingPortal}
              disabled={billingLoading}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
